#include <iostream>
#include <fstream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <climits>
#include "Quadtree.h"

using namespace std;

void minMax(Point2&, Point2&, Point3);

int main(int argc, char* argv[]) {
	if(argc < 2) {
		cout << "Please provide a source file as a command line aregument" << endl;
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
	while(ignore != "end_header") {
		getline(inFile, ignore);
	}
	while(!inFile.eof()) {
		inFile >> currPoint.x >> currPoint.y >> currPoint.z;
		getline(inFile, ignore);
		points.push_back(currPoint);
		minMax(min, max, currPoint);
	}
	inFile.close();

	min.x -= 0.5; min.y -=0.5; max.x += 0.5; max.y += 0.5;

	string filename(argv[1]);
	Quadtree qt(min, max, 10000, filename.erase(filename.rfind("."), string::npos) + "_qt");
	for(UINT i = 0; i < points.size(); i++) {
		qt.addPoint(points[i]);
	}
	qt.commit();
}

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