//
//  main.cpp
//  kdtree
//
//  Created by Yuping on 6/24/13.
//  Copyright (c) 2013 Yuping. All rights reserved.
//
//	Adapted by Kenneth Derda
 
#include <iostream>
#include <sstream>
#include <fstream>
#include <iomanip>
#include <queue>
#include <stdio.h>
#include <stdlib.h>
#include "Node.h"
#include <WinSock2.h>
#include <mysql.h>
#include <m_string.h>

using namespace std;

int cdf[3][256] = {0};
int cdfStart[3] = {0};
int totalPoints;

double orthoSize;
float colorScale[3];
float colorBias[3];
int colorMin[3] = {255, 255, 255};
int colorMax[3] = {0};

unsigned int density = 10000;  
string tablename;

queue<Node> nodequeue;
MYSQL db;

void insertsql(Node &child);

void splitIntoChildren();

void minMaxColor(int[], int[], Point);

string toString(double d) {
	ostringstream outString;
	outString << d;
	return outString.str();
}

int main(int argc, const char * argv[]) {  
    if(argc < 2) {
        cout << "Please provide a source file as a command line argument" << endl;
        exit(1);
    }
    ifstream inFile(argv[1]);
    if(!inFile) {
        cout << "Could not open file: " << argv[1] << endl;
        exit(1);
    }
    string filename(argv[1]);
	filename.erase(0, filename.rfind("\\") + 1);
    tablename = filename.erase(filename.rfind("."), string::npos) + "_new";

    string ignore = "";
    PVEC pVector;
    Point currPoint;
    while(ignore != "end_header") {
        getline(inFile, ignore);
    }
    while(!inFile.eof()) {
        inFile >> currPoint.x >> currPoint.y >> currPoint.z >> currPoint.r >> currPoint.g >> currPoint.b >> currPoint.i >> currPoint.ix >> currPoint.iy;
        pVector.push_back(currPoint);
        minMaxColor(colorMin, colorMax, currPoint);
        cdf[0][currPoint.r]++;
        cdf[1][currPoint.g]++;
        cdf[2][currPoint.b]++;
    }
    inFile.close();

    Node root = Node(pVector);

    totalPoints = (int)pVector.size();

    if(root.maxab.x - root.minab.x > root.maxab.y - root.minab.y) {
        orthoSize = (root.maxab.x - root.minab.x) * 0.625f;
    }
    else {
        orthoSize = (root.maxab.y - root.minab.y) * 0.625f;
    }

	for(int i = 0; i < 3; i++) {
		bool found = false;
		for(int j = 0; j < 255; j++) {
			cdf[i][j + 1] += cdf[i][j];
			if(cdf[i][j] > 0 && !found) {
				cdfStart[i] = j;
				found = true;
			}
		}
	}

    colorBias[0] = float(colorMin[0]) / 255.0f;
    colorBias[1] = float(colorMin[1]) / 255.0f;
    colorBias[2] = float(colorMin[2]) / 255.0f;
    colorScale[0] = 255.0f / float(colorMax[0] - colorMin[0]);
    colorScale[1] = 255.0f / float(colorMax[1] - colorMin[1]);
    colorScale[2] = 255.0f / float(colorMax[2] - colorMin[2]);

    //connect to the database
    mysql_init(&db);
    if(!mysql_real_connect(&db, "127.0.0.1", "root", "jessica", "markers", 3306, NULL, 0)) {
        cout << "Cannot connect to the database." << endl;
        exit(1);
    }
    //create a new table
    string query = "CREATE TABLE IF NOT EXISTS " + tablename + "(path varchar(40) NOT NULL, data MEDIUMTEXT NOT NULL, PRIMARY KEY(path))";
	if(mysql_real_query(&db, query.c_str(), (UINT)query.length())) {
		cout << "Failed to insert row, Error: " << mysql_error(&db) << endl;
        exit(1);
	}

    nodequeue.push(root);
    insertsql(root);    
    while(!nodequeue.empty()) {
        splitIntoChildren();
    }
    
    cout << "Finished inserting." << endl;
    return 0;
}

//self-defined sorting
bool SortByX(Point &v1, Point &v2)
{
    return v1.x < v2.x;
}

bool SortByY(Point &v1, Point &v2)
{
    return v1.y < v2.y;
}

bool SortByZ(Point &v1, Point &v2)
{
    return v1.z < v2.z;
}

void insertsql(Node &child) {        
    string query = "INSERT INTO " + tablename + "(path, data) values('" + child.name + "', '{\"Isleaf\":";
    query += child.isleaf ? "true" : "false";
    
    query += ",\"BB\":[" + toString(child.minab.x) + "," + toString(child.minab.y) + "," + toString(child.minab.z) + "," + toString(child.maxab.x) + "," + toString(child.maxab.y) + "," + toString(child.maxab.z) + "]";

	// for x y z r g b r' g' b' index screenX screenY where r' g' b' is the histogram equalized color per channel
	int newVal[3];
    if(child.isleaf) {
        query += ",\"Point\":[";
		for(vector<Point>::iterator it = child.pointVector.begin(); it != child.pointVector.end() - 1; it++) {
            newVal[0] = (int)((float)(cdf[0][it->r] - cdf[0][cdfStart[0]]) / (float)(totalPoints - cdf[0][cdfStart[0]]) * 255.0f);
            newVal[1] = (int)((float)(cdf[1][it->g] - cdf[1][cdfStart[1]]) / (float)(totalPoints - cdf[1][cdfStart[1]]) * 255.0f);
            newVal[2] = (int)((float)(cdf[2][it->b] - cdf[2][cdfStart[2]]) / (float)(totalPoints - cdf[2][cdfStart[2]]) * 255.0f);
            query += toString(it->x) + "," + toString(it->y) + "," + toString(it->z) + "," + to_string(it->r) + "," + to_string(it->g) + "," + to_string(it->b) + "," + to_string(newVal[0]) + "," + to_string(newVal[1]) + "," + to_string(newVal[2]) + "," + to_string(it->i) + "," + toString(it->ix) + "," + toString(it->iy) + ",";
        }
		vector<Point>::iterator it = child.pointVector.end();
        --it;
        newVal[0] = (int)((float)(cdf[0][it->r] - cdf[0][cdfStart[0]]) / (float)(totalPoints - cdf[0][cdfStart[0]]) * 255.0f);
        newVal[1] = (int)((float)(cdf[1][it->g] - cdf[1][cdfStart[1]]) / (float)(totalPoints - cdf[1][cdfStart[1]]) * 255.0f);
        newVal[2] = (int)((float)(cdf[2][it->b] - cdf[2][cdfStart[2]]) / (float)(totalPoints - cdf[2][cdfStart[2]]) * 255.0f);
        query += toString(it->x) + "," + toString(it->y) + "," + toString(it->z) + "," + to_string(it->r) + "," + to_string(it->g) + "," + to_string(it->b) + "," + to_string(newVal[0]) + "," + to_string(newVal[1]) + "," + to_string(newVal[2]) + "," + to_string(it->i) + "," + toString(it->ix) + "," + toString(it->iy) + "]";
    }
    else if(child.name == "r") {
        query += ",\"b\":[" + toString(colorBias[0]) + "," + toString(colorBias[1]) + "," + toString(colorBias[2]) + "],\"s\":[" + toString(colorScale[0]) + "," + toString(colorScale[1]) + "," + toString(colorScale[2]) + "],\"o\":" + toString(orthoSize);
    }
    query += "}')";
    
    if(mysql_real_query(&db, query.c_str(), (UINT)query.size())) {
        cout << "Failed to insert row, Error: " << mysql_error(&db) << endl;
        exit(1);
    }
}

void splitIntoChildren() {
    string parentname = nodequeue.front().name;
    PVEC v0 = nodequeue.front().pointVector;

    nodequeue.pop();

	//sort by x
    sort(v0.begin(), v0.end(), SortByX);
    PVEC v1(make_move_iterator(v0.begin() + v0.size() / 2), make_move_iterator(v0.end()));
    v0.erase(v0.begin() + v0.size() / 2, v0.end());

    //sort by y
    sort(v0.begin(), v0.end(), SortByY);
    PVEC v2(make_move_iterator(v0.begin() + v0.size() / 2), make_move_iterator(v0.end()));
    v0.erase(v0.begin() + v0.size() / 2, v0.end());
    
    sort(v1.begin(), v1.end(), SortByY);
    PVEC v3(make_move_iterator(v1.begin() + v1.size() / 2), make_move_iterator(v1.end()));
    v1.erase(v1.begin() + v1.size() / 2, v1.end());
    
    //sort by z
    sort(v0.begin(), v0.end(), SortByZ);
    PVEC v4(make_move_iterator(v0.begin() + v0.size() / 2), make_move_iterator(v0.end()));
    v0.erase(v0.begin() + v0.size() / 2, v0.end());
    
    sort(v1.begin(), v1.end(), SortByZ);
    PVEC v5(make_move_iterator(v1.begin() + v1.size() / 2), make_move_iterator(v1.end()));
    v1.erase(v1.begin() + v1.size() / 2, v1.end());
    
    sort(v2.begin(), v2.end(), SortByZ);
    PVEC v6(make_move_iterator(v2.begin() + v2.size() / 2), make_move_iterator(v2.end()));
    v2.erase(v2.begin() + v2.size() / 2, v2.end());
    
    sort(v3.begin(), v3.end(), SortByZ);
    PVEC v7(make_move_iterator(v3.begin() + v3.size() / 2), make_move_iterator(v3.end()));
    v3.erase(v3.begin() + v3.size() / 2, v3.end());

    Node child[8];
    child[0] = Node(v0, 0, parentname, density);
    child[1] = Node(v1, 1, parentname, density);
    child[2] = Node(v2, 2, parentname, density);
    child[3] = Node(v3, 3, parentname, density);
    child[4] = Node(v4, 4, parentname, density);
    child[5] = Node(v5, 5, parentname, density);
    child[6] = Node(v6, 6, parentname, density);
    child[7] = Node(v7, 7, parentname, density);
    
    for (int i = 0; i < 8; i++) {
        if (child[i].isleaf == false) {
            nodequeue.push(child[i]);
        }
        insertsql(child[i]);
    }
}

void minMaxColor(int min[], int max[], Point curr) {
    if(min[0] > curr.r) {
        min[0] = curr.r;
    }
    else if(max[0] < curr.r) {
        max[0] = curr.r;
    }
    if(min[1] > curr.g) {
        min[1] = curr.g;
    }
    else if(max[1] < curr.g) {
        max[1] = curr.g;
    }
    if(min[2] > curr.b) {
        min[2] = curr.b;
    }
    else if(max[2] < curr.b) {
        max[2] = curr.b;
    }
}