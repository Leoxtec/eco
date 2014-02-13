//
//  Node.h
//  kdtree
//
//  Created by Yuping on 6/25/13.
//  Copyright (c) 2013 Yuping. All rights reserved.
//
//  Adapted by Kenneth Derda

#ifndef __kdtree__Node__
#define __kdtree__Node__

#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <vector>

using namespace std;

struct Vec3 {
    double x, y, z;
};

//point structure
struct Point {
    double x, y, z, ix, iy;
    int r, g, b, i;
};

typedef vector<Point> PVEC;

class Node
{
public:
    Vec3 minab, maxab;
    PVEC pointVector;
	string name;
    bool isleaf;
    
public:
	Node(PVEC pointVector1 = vector<Point>(),int index = 0, string parentname = "", unsigned int density = 0) {
        pointVector = pointVector1;

        if (parentname == "") {
            name = "r";
        }
        else {
			name = parentname + "/" + to_string(index);
        }
        if (pointVector.size() != 0) {

            minab.x = pointVector.front().x;
            minab.y = pointVector.front().y;
            minab.z = pointVector.front().z;
            maxab.x = pointVector.front().x;
            maxab.y = pointVector.front().y;
            maxab.z = pointVector.front().z;
            
            //compute the Boundingbox
			for (vector<Point>::iterator i = pointVector.begin(); i != pointVector.end(); ++i) {
                
                if (i->x < minab.x) {
                    minab.x = i->x;
                }
                if (i->x > maxab.x) {
                    maxab.x = i->x;
                }            
                if (i->y < minab.y) {
                    minab.y = i->y;
                }
                if (i->y > maxab.y) {
                    maxab.y = i->y;
                }
                if (i->z < minab.z) {
                    minab.z = i->z;
                }
                if (i->z > maxab.z) {
                    maxab.z = i->z;
                }
            }

            if (pointVector.size() < density) {
                isleaf = true;
            }
            else {
                isleaf = false;
            }
        }
    }
};


#endif /* defined(__kdtree__Node__) */