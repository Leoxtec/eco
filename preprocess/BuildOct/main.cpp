//main driver for building the octree
//parses the point cloud file and runs the octree 
//class

#include <iostream>
#include <fstream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <limits>
#include <cmath>
#include "OctTree.h"

using namespace std;

//prototype
void minMax(Point&, Point&, Point);


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
	vector<Point> points;
	float inf = numeric_limits<float>::infinity();
	Point min = {inf, inf, inf, 0.0, 0.0, 255, 255, 255, 0}, max = {-inf, -inf, -inf, 0.0, 0.0, 0, 0, 0, 0};
	Point currPoint;
	int cdf[3][256] = {{0}, {0}, {0}};

	//read past the header
	while(ignore != "end_header") {
		getline(inFile, ignore);
	}

	//grab all point data, determine global bounding box and accumulate bins to calculate the cumulative distribution function
	while(!inFile.eof()) {
		inFile >> currPoint.x >> currPoint.y >> currPoint.z >> currPoint.r >> currPoint.g >> currPoint.b >> currPoint.i >> currPoint.ix >> currPoint.iy;
		points.push_back(currPoint);
		minMax(min, max, currPoint);
		cdf[0][currPoint.r]++;
        cdf[1][currPoint.g]++;
        cdf[2][currPoint.b]++;
	}
	inFile.close();

	//expand global bounding box to avoid losing points due to round off error
	min.x -= 0.5; min.y -= 0.5; min.z -= 0.5; max.x += 0.5; max.y += 0.5; max.z += 0.5;

	//determine cell spacing based on volume and transfer rate threshold
	//this is what essentially determines the root sampling frequency
	//and assumes a dense cloud
	double volume = (max.x - min.x) * (max.y - min.y) * (max.z - min.z);
	double rootDimDelta = ceil(pow(volume / (double)maxPointsPerNode, 1.0 / 3.0));
	cout << "root dim = " << rootDimDelta << endl;

	//expand global bounding box to be a mulitple of the cell spacing
	min.x = floor(min.x / rootDimDelta) * rootDimDelta;
	min.y = floor(min.y / rootDimDelta) * rootDimDelta;
	min.z = floor(min.z / rootDimDelta) * rootDimDelta;
	max.x = ceil(max.x / rootDimDelta) * rootDimDelta;
	max.y = ceil(max.y / rootDimDelta) * rootDimDelta;
	max.z = ceil(max.z / rootDimDelta) * rootDimDelta;

	//build octree
	string filename(argv[1]);
	filename.erase(0, filename.rfind("/") + 1);
	string tablename = filename.erase(filename.rfind("."), string::npos);
	OctTree ot(min, max, rootDimDelta, cdf, points, tablename);
	ot.commit();
}

//function to determine the min and max of both vertices and
//colors (which are used for color enhancement)
void minMax(Point& min, Point& max, Point curr) {
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
	if(min.z > curr.z) {
		min.z = curr.z;
	}
	else if(max.z < curr.z) {
		max.z = curr.z;
	}

	if(min.r > curr.r) {
        min.r = curr.r;
    }
    else if(max.r < curr.r) {
        max.r = curr.r;
    }
    if(min.g > curr.g) {
        min.g = curr.g;
    }
    else if(max.g < curr.g) {
        max.g = curr.g;
    }
    if(min.b > curr.b) {
        min.b = curr.b;
    }
    else if(max.b < curr.b) {
        max.b = curr.b;
    }
}