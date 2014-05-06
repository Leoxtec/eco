//This code is largley adapted from http://potree.org
//partitions the point cloud into an octree by
//sampling the point cloud at increasing frequencies
//at each level of the octree

#include <vector>
#include <map>
#include <queue>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <driver.h>
#include <connection.h>
#include <statement.h>

using namespace std;
using namespace sql;

//this value is based on keeping the transfer rate of
//a single node below a megabyte
const int maxPointsPerNode = 22 * 22 * 22;

//struct to hold the data per point needed for the
//ecosynth viewer
struct Point {
    double x, y, z, ix, iy;
    int r, g, b, i;
};

struct Point3 {
	double x, y, z;
};

//struct used to minimize the memory needed for holding
//all points within a node.  Better than creating a 3d array that 
//may be sparse
struct Cell {
	int x, y, z;

	//used by the STL Map to determine order
	bool operator<(const Cell& c) const {
		if(x < c.x) {
			return true;
		} else if(x == c.x && y < c.y) {
			return true;
		} else if(x == c.x && y == c.y && z < c.z) {
			return true;
		}

		return false;
	}
};

//used to customize output for ints, floats and doubles at
//various precisions
template <typename T>
string toString(T t, int precision) {
	ostringstream outString;
	outString << setprecision(precision) << fixed << t;
	return outString.str();
}



class OctTree {

	//inner node class to hold bounding box and extents
	//as well as a path description of the nodes position 
	//in the octree.
	class Node {
	public:
		Point3 min;
		Point3 max;
		Point3 dim;
		vector<Point> points;
		double dimDelta;
		string path;

		Node(Point3 minVec, Point3 maxVec, double delta, string p) {
			min = minVec;
			max = maxVec;
			dim.x = (max.x - min.x) * 0.5f;
			dim.y = (max.y - min.y) * 0.5f;
			dim.z = (max.z - min.z) * 0.5f;
			this->dimDelta = delta;
			path = p;
		}

		~Node() {
		}
	};

public:

	OctTree(Point min, Point max, double rootDelta, int cdf[][256], vector<Point> points, string t) {
		//set global bounding box
		rootMin.x = min.x; rootMin.y = min.y; rootMin.z = min.z;
		rootMax.x = max.x; rootMax.y = max.y; rootMax.z = max.z;
		this->rootDelta = rootDelta;

		//build the cumulative distribution function for histogram
		//equalization color enhancement
		for(int i = 0; i < 3; i++) {
			bool found = false;
			this->cdf[i][0] = cdf[i][0];
			for(int j = 0; j < 255; j++) {
				this->cdf[i][j + 1] = this->cdf[i][j] + cdf[i][j + 1];
				if(this->cdf[i][j] > 0 && !found) {
					cdfStart[i] = j;
					found = true;
				}
			}
		}

		//determine the orthographic size needed to properly generate and display
		//the map and the grid
		if(max.x - min.x > max.y - min.y) {
			orthoSize = (max.x - min.x) * 0.625f;
		}
		else {
			orthoSize = (max.y - min.y) * 0.625f;
		}

		//set the color bias and scale needed for min max color enhancement of points
		colorBias[0] = float(min.r) / 255.0f;
		colorBias[1] = float(min.g) / 255.0f;
		colorBias[2] = float(min.b) / 255.0f;
		colorScale[0] = 255.0f / float(max.r - min.r);
		colorScale[1] = 255.0f / float(max.g - min.g);
		colorScale[2] = 255.0f / float(max.b - min.b);

		cloud = points;
		tableName = t;
		totalPoints = (int)points.size();
	}

	~OctTree() {
		delete stmt;
		con->close();
		delete con;
		delete root;
	}

	void commit() {
		//establish connection to the database
		driver = get_driver_instance();
		con = driver->connect("tcp://127.0.0.1:3306", "root", "jessica");
		con->setSchema("markers");
		stmt = con->createStatement();

		//build database table for markers related to this particular point cloud
		string query = "DROP TABLE IF EXISTS " + tableName + "_markers";
		stmt->execute(query);

		query = "CREATE TABLE IF NOT EXISTS " + tableName + "_markers(id int(11) NOT NULL AUTO_INCREMENT, points text NOT NULL, height float NOT NULL, " +
  				"species varchar(20) NOT NULL, description text NOT NULL, user varchar(20) NOT NULL, PRIMARY KEY (id))";
		stmt->execute(query);


		//create the database table to hold the octree
		tableName += "_oct";
		query = "DROP TABLE IF EXISTS " + tableName;
		stmt->execute(query);

		query = "CREATE TABLE IF NOT EXISTS " + tableName + "(path VARCHAR(40) NOT NULL, data MEDIUMTEXT NOT NULL, PRIMARY KEY(path))";
		stmt->execute(query);


		//set root node, recursively build the octree as well as the metadata for
		//the entire cloud 
		root = new Node(rootMin, rootMax, rootDelta, "r");
		root->points = cloud;
		string meta = recursiveCommit(root);

		//commit the metadata
		query = "INSERT INTO " + tableName + "(path, data) values('meta', '{" + meta + "}')";
		stmt->execute(query);
	}

private:
	Node* root;
	string tableName;
	int cdf[3][256];
	Point3 rootMin, rootMax;
	double rootDelta;
	vector<Point> cloud;
	int cdfStart[3];
	double orthoSize;
	float colorScale[3];
	float colorBias[3];
	int totalPoints;
	Driver *driver;
	Connection *con;
	Statement *stmt;

	string recursiveCommit(Node* n) {
		//calculate the center and radius of the node and add it to the metadata
		Point3 center = {(n->min.x + n->max.x) * 0.5, (n->min.y + n->max.y) * 0.5, (n->min.z + n->max.z) * 0.5};
		string meta = "\"p\":\"" + n->path + "\",\"c\":[" + toString(center.x, 3) + "," + toString(center.y, 3) + "," + toString(center.z, 3) + "]" +
						",\"r\":" + toString(sqrt(center.x * center.x + center.y * center.y + center.z * center.z), 3);

		//for the root, add additional metatdata for color enhancement as well as map and grid size
		if(n->path == "r") {
			meta += ",\"BB\":[" + toString(n->min.x, 3) + "," + toString(n->min.y, 3) + "," + toString(n->min.z, 3) + "," + 
								  toString(n->max.x, 3) + "," + toString(n->max.y, 3) + "," + toString(n->max.z, 3) + "]" +
					",\"b\":[" + toString(colorBias[0], 6) + "," + toString(colorBias[1], 6) + "," + toString(colorBias[2], 6) + 
					"],\"s\":[" + toString(colorScale[0], 6) + "," + toString(colorScale[1], 6) + "," + toString(colorScale[2], 6) + 
					"],\"o\":" + toString(orthoSize, 3);
		}
		meta +=  + ",\"ch\":[";

		//sample points for this node and partition remaining points into the node's children
		if(n->points.size() > (unsigned int)maxPointsPerNode) {
			queue<Node*> q;
			map<Cell, Point> cells;
			vector<Node*> children;
			children.resize(8);
			Point3 subDim = n->dim;
			double scale = 1.0 / n->dimDelta;

			while(!n->points.empty()) {
				Point currPoint = n->points[n->points.size() - 1];
				n->points.pop_back();
				Cell currCell = {(int)(currPoint.x * scale), (int)(currPoint.y * scale), (int)(currPoint.z * scale)};

				//if this cell already has a point, determine which child the point belongs to and add
				//it to that child
				if(cells.find(currCell) != cells.end()) {
					int offsets[3] = {(int)((currPoint.x - n->min.x) / subDim.x), (int)((currPoint.y - n->min.y) / subDim.y), (int)((currPoint.z - n->min.z) / subDim.z)};
					int index = offsets[0] * 4 + offsets[1] * 2 + offsets[2];
					if(!children[index]) {
						Point3 min = {n->min.x + offsets[0] * subDim.x, n->min.y + offsets[1] * subDim.y, n->min.z + offsets[2] * subDim.z};
						Point3 max = {min.x + subDim.x, min.y + subDim.y, min.z + subDim.z};
						children[index] = new Node(min, max, n->dimDelta * 0.5, n->path + toString(index, 0));
						q.push(children[index]);
					}
					children[index]->points.push_back(currPoint);
				}
				else {
					cells[currCell] = currPoint;
				}
			}

			//build and commit the table entry
			string query = "INSERT INTO " + tableName + "(path, data) values('" + n->path + "', '[";
			int newVal[3];
			for(map<Cell, Point>::iterator it = cells.begin(); it != cells.end(); it++) {
				Point p = it->second;
				newVal[0] = (int)((float)(cdf[0][p.r] - cdf[0][cdfStart[0]]) / (float)(totalPoints - cdf[0][cdfStart[0]]) * 255.0f);
				newVal[1] = (int)((float)(cdf[1][p.g] - cdf[1][cdfStart[1]]) / (float)(totalPoints - cdf[1][cdfStart[1]]) * 255.0f);
				newVal[2] = (int)((float)(cdf[2][p.b] - cdf[2][cdfStart[2]]) / (float)(totalPoints - cdf[2][cdfStart[2]]) * 255.0f);
				query += toString(p.x, 3) + "," + toString(p.y, 3) + "," + toString(p.z, 3) + "," + toString(p.r, 0) + "," + toString(p.g, 0) + "," + toString(p.b, 0) + "," + 
						 toString(newVal[0], 0) + "," + toString(newVal[1],0) + "," + toString(newVal[2], 0) + "," + toString(p.i, 0) + "," + toString(p.ix, 6) + "," + toString(p.iy, 6) + ",";
			}
			query.erase(query.rfind(","), string::npos);
			query += "]')";
			stmt->execute(query);

			//build metadata and recurse on children
			while(!q.empty()) {
				meta += "{" + recursiveCommit(q.front()) + "},";
				q.pop();
			}
			meta.erase(meta.rfind(","), string::npos);
			return meta + "]";
		}
		else {
			//if we're under the transfer rate threshold then build the query and metadata and stop resursion 
			string query = "INSERT INTO " + tableName + "(path, data) values('" + n->path + "', '[";
			int newVal[3];
			for(vector<Point>::iterator it = n->points.begin(); it != n->points.end(); it++) {
				newVal[0] = (int)((float)(cdf[0][it->r] - cdf[0][cdfStart[0]]) / (float)(totalPoints - cdf[0][cdfStart[0]]) * 255.0f);
				newVal[1] = (int)((float)(cdf[1][it->g] - cdf[1][cdfStart[1]]) / (float)(totalPoints - cdf[1][cdfStart[1]]) * 255.0f);
				newVal[2] = (int)((float)(cdf[2][it->b] - cdf[2][cdfStart[2]]) / (float)(totalPoints - cdf[2][cdfStart[2]]) * 255.0f);
				query += toString(it->x, 3) + "," + toString(it->y, 3) + "," + toString(it->z, 3) + "," + toString(it->r, 0) + "," + toString(it->g, 0) + "," + toString(it->b, 0) + "," + 
						 toString(newVal[0], 0) + "," + toString(newVal[1], 0) + "," + toString(newVal[2], 0) + "," + toString(it->i, 0) + "," + toString(it->ix, 6) + "," + toString(it->iy, 6) + ",";
			}
			query.erase(query.rfind(","), string::npos);
			query += "]')";
			stmt->execute(query);
			n->points.resize(0);
			return meta + "]";
		}
	}
};