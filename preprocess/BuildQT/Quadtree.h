//This class partitions the point cloud into a quad tree (in x and y) 
//for determining the 95th percentile of point height within a marker's polygon bounds

#include <vector>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <driver.h>
#include <connection.h>
#include <statement.h>
#include <exception.h>

using namespace std;
using namespace sql;

typedef struct Point2 {
	float x, y;
} Point2;

typedef struct Point3 {
	float x, y, z;
} Point3;

class Quadtree {

	//inner node class to hold bounding box and extents
	//as well as points left to partition and links to children
	class Node {
	public:
		Point2 min;
		Point2 max;
		Point2 subDim;
		vector<Point3> points;
		vector<Node*> children;
		bool leaf;

		Node(Point2 minVec, Point2 maxVec) {
			children.resize(4);
			min = minVec;
			max = maxVec;
			subDim.x = (max.x - min.x) * 0.5f;
			subDim.y = (max.y - min.y) * 0.5f;
			leaf = true;
		}

		~Node() {
			for(unsigned int i = 0; i < children.size(); i++) {
				if(children[i]) {
					delete children[i];
				}
			}
		}
	};

public:

	Quadtree(Point2 minVec, Point2 maxVec, int d, string t) {
		root = new Node(minVec, maxVec);
		density = d;
		tableName = t;
	}

	~Quadtree() {
		delete stmt;
		con->close();
		delete con;
		delete root;
	}

	void addPoint(Point3 p) {
		addPointRecurse(root, p);
	}

	void commit() {
		//establish connection to the database and recursively commit the quad tree to the database
		try {
			driver = get_driver_instance();
			con = driver->connect("tcp://127.0.0.1:3306", "root", "jessica");
			con->setSchema("EcoBrowser");
			stmt = con->createStatement();
			stmt->execute("DROP TABLE IF EXISTS " + tableName);
			stmt->execute("CREATE TABLE IF NOT EXISTS " + tableName + "(path varchar(40) NOT NULL, header varchar(60) NOT NULL, data MEDIUMTEXT NOT NULL, PRIMARY KEY(path))");
		}
		catch(SQLException &e) {
			cout << "# ERR: SQLException in " << __FILE__;
			cout << "(" << __FUNCTION__ << ") on line " << __LINE__ << endl;
			cout << "# ERR: " << e.what();
			cout << " (MySQL error code: " << e.getErrorCode();
			cout << ", SQLState: " << e.getSQLState() << " )" << endl;
		}
		commitRecurse(root, "r");
	}

private:
	Node* root;
	unsigned int density;
	string tableName;
	Driver *driver;
	Connection *con;
	Statement *stmt;

	void addPointRecurse(Node* n, Point3 p) {
		if(n->leaf) {
			if(n->points.size() < density) {
				n->points.push_back(p);
			}
			else {
				for(unsigned int i = 0; i < n->points.size(); i++) {
					addToChild(n, n->points[i]);
				}
				addToChild(n, p);
				n->points.clear();
				n->leaf = false;
			}
		}
		else {
			addToChild(n, p);
		}
	}

	void addToChild(Node* n, Point3 p) {
		int offsets[2] = {(int)((p.x - n->min.x) / n->subDim.x), (int)((p.y - n->min.y) / n->subDim.y)};
		int index = offsets[0] * 2 + offsets[1];
		if(!n->children[index]) {
			Point2 min = {n->min.x + offsets[0] * n->subDim.x, n->min.y + offsets[1] * n->subDim.y};
			Point2 max = {min.x + n->subDim.x, min.y + n->subDim.y};
			n->children[index] = new Node(min, max);
		}
		addPointRecurse(n->children[index], p);
	}

	//function to output double as string
	string doubleToString(double d) {
		ostringstream outString;
		outString << d;
		return outString.str();
	}

	//function to output int as string
	string intToString(int i) {
		ostringstream outString;
		outString << i;
		return outString.str();
	}

	void commitRecurse(Node* n, string path) {
		//determine number of children for this node
		//if no children, then this is a leaf node and all points go in it
		int childCount = 0;
		for(int i = 0; i < 4; i++) {
			if(n->children[i]) {
				childCount++;
			}
		}

		//build up query string starting with the metadata for this particular node
		string query = "INSERT INTO "+ tableName +"(path, header, data) values('" + path + "', '{\"numChildren\":" + intToString(childCount) + 
					  ",\"BB\":[" + doubleToString(n->min.x) + "," + doubleToString(n->min.y) + "," + doubleToString(n->max.x) + "," + doubleToString(n->max.y) +
					  	"]}', '[";

		//recursively commit if not a leaf node
		if(childCount > 0) {
			for(int i = 0; i < 4; i++) {
				if(n->children[i]) {
					commitRecurse(n->children[i], path + "/" + intToString(i));
				}
			}
		}
		else {
			//add point data to the query
			unsigned int i;
			for(i = 0; i < n->points.size() - 1; i++) {
				query += doubleToString(n->points[i].x) + "," + doubleToString(n->points[i].y) + "," + doubleToString(n->points[i].z) + ",";
			}
			query += doubleToString(n->points[i].x) + "," + doubleToString(n->points[i].y) + "," + doubleToString(n->points[i].z);
		}
		query += "]')";

		//add to the database
		try {
			stmt->execute(query);
		}
		catch(SQLException &e) {
			cout << "# ERR: SQLException in " << __FILE__;
			cout << "(" << __FUNCTION__ << ") on line " << __LINE__ << endl;
			cout << "# ERR: " << e.what();
			cout << " (MySQL error code: " << e.getErrorCode();
			cout << ", SQLState: " << e.getSQLState() << " )" << endl;
		}
	}
};