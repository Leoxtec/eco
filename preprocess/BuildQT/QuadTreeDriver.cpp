//main driver for building the quad tree
//parses the point cloud file and runs the quad tree 
//class

#include <iostream>
#include <fstream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <limits>
#include "Quadtree.h"

using namespace std;

//prototype
void minMax(Point2&, Point2&, Point3);

int main(int argc, char* argv[]) {
	//parse command line arguments
	if(argc < 2) {
		cout << "Please provide a source file as a command line argument" << endl;
		exit(1);
	}
	ifstream inFile(argv[1]);
	if(!inFile) {
		cout << "Could not open file: " << argv[1] << endl;
		exit(1);
	}

	string ignore = "";
	vector<Point3> points;
	float inf = numeric_limits<float>::infinity();
	Point2 min = {inf, inf}, max = {-inf, -inf};
	Point3 currPoint;

	//read past the header
	while(ignore != "end_header") {
		getline(inFile, ignore);
	}

	//grab all point data and determine global bounding box
	while(!inFile.eof()) {
		inFile >> currPoint.x >> currPoint.y >> currPoint.z;
		getline(inFile, ignore);
		points.push_back(currPoint);
		minMax(min, max, currPoint);
	}
	inFile.close();

	//expand global bounding box to avoid losing points due to round off error
	min.x -= 0.5; min.y -=0.5; max.x += 0.5; max.y += 0.5;

	//build quad tree
	string filename(argv[1]);
	filename.erase(0, filename.rfind("/") + 1);
	string tablename = filename.erase(filename.rfind("."), string::npos);
	Quadtree qt(min, max, 10000, tablename + "_qt");
	for(unsigned int i = 0; i < points.size(); i++) {
		qt.addPoint(points[i]);
	}
	qt.commit();
}

//function to determine the min and max of vertices for 
//bounding box vectors
void minMax(Point2& min, Point2& max, Point3 curr) {
	if(min.x > curr.x) {
		min.x = curr.x;
	}
	else if(max.x < curr.x) {
		max.x = curr.x;
	}
	if(min.y > curr.y) {
		min.y = curr.y;
	}
	else if(max.y < curr.y) {
		max.y = curr.y;
	}
}