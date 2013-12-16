#include <vector>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <WinSock2.h>
#include <mysql.h>
#include <m_string.h>

using namespace std;

typedef struct Point2 {
	float x, y;
} Point2;

typedef struct Point3 {
	float x, y, z;
} Point3;

class Quadtree {

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
			for(UINT i = 0; i < children.size(); i++) {
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
		delete root;
	}

	void addPoint(Point3 p) {
		addPointRecurse(root, p);
	}

	void commit() {
		mysql_init(&db);
		mysql_real_connect(&db, "127.0.0.1", "root", "jessica", "markers", 3306, NULL, 0);
		string query = "CREATE TABLE IF NOT EXISTS " + tableName + "(path VARCHAR(40) NOT NULL, data MEDIUMTEXT NOT NULL, PRIMARY KEY(path))";
		mysql_real_query(&db, query.c_str(), (UINT)query.length());
		commitRecurse(root, "r");
	}

private:
	Node* root;
	MYSQL db;
	UINT density;
	string tableName;

	void addPointRecurse(Node* n, Point3 p) {
		if(n->leaf) {
			if(n->points.size() < density) {
				n->points.push_back(p);
			}
			else {
				for(UINT i = 0; i < n->points.size(); i++) {
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

	string toString(float f) {
		ostringstream outString;
		outString << setprecision(3) << fixed << f;
		return outString.str();
	}

	void commitRecurse(Node* n, string path) {
		int childCount = 0;
		for(int i = 0; i < 4; i++) {
			if(n->children[i]) {
				childCount++;
			}
		}
		string query = "INSERT INTO "+ tableName +"(path, data) values('" + path + "', '{\"numChildren\":" + to_string(childCount) + 
					  ",\"BB\":[" + toString(n->min.x) + "," + toString(n->min.y) + "," + toString(n->max.x) + "," + toString(n->max.y);
		if(childCount > 0) {
			for(int i = 0; i < 4; i++) {
				if(n->children[i]) {
					commitRecurse(n->children[i], path + "/" + to_string(i));
				}
			}
		}
		else {
			query += "],\"Point\":[";
			UINT i;
			for(i = 0; i < n->points.size() - 1; i++) {
				query += toString(n->points[i].x) + "," + toString(n->points[i].y) + "," + toString(n->points[i].z) + ",";
			}
			query += toString(n->points[i].x) + "," + toString(n->points[i].y) + "," + toString(n->points[i].z);
		}
		query += "]}')";
		mysql_real_query(&db, query.c_str(), (UINT)query.size());
	}
};