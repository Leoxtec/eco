//main driver for generating the per point ecosynth browser data
//from a bundler output
//per point data includes georeferenced position, original color and 
//photo reference (photo id plus xy position in the photo)

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <cmath>
#include <stdio.h>
#include <stdlib.h>
using namespace std;

struct geoRefTrans {
	double mat[3][3];
	double s, Tz;
};

//prototype
void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]);

/**
	Main function for extracting Bundler file. Creates modified PLY.
	The ply does not translate over the X and Y dimensions.
	The ply has extra information mapping images to points

	@param Filepath with Bundler directory and georef_transform.txt
		/bundleDir/bundle.out
		/georef_transform.ply
	
	Output:
		unfiltered_ecobrowser.ply

	Example PLY: 
		<x> <y> <z> <r> <g> <b> <cam_index> <image_x> <image_y>
		XYZRGB_Idxcam_Ximg_Yimg

*/
int main(int argc, const char* argv[]) {
	//parse command line arguments
	if(argc < 2) {
		cout << "please add working directory as command line argument" << endl;
		exit(1);
	}
	string path(argv[1]);

	//strip off the leading directory for the base filename
	string filename(argv[1]);
	unsigned int slashPos = filename.rfind("/");
	if(slashPos != string::npos) {
		filename.erase(0, slashPos + 1);
	}

	//read in and store the georefence transform
	struct geoRefTrans geoRef;
	double omega, phi, kappa, ignoreDouble;
	ifstream inFile((path + "/georef_transform.txt").c_str());
	if(!inFile) {
		cout << "could not open georeference transform file." << endl;
		cout << "please ensure file path is correct" << endl;
		exit(0);
	}
	inFile >> omega >> phi >> kappa >> geoRef.s >> ignoreDouble >> ignoreDouble >> geoRef.Tz;
	inFile.close();
	geoRef.mat[0][0] = cos(phi) * cos(kappa);
	geoRef.mat[0][1] = sin(omega) * sin(phi) * cos(kappa) + cos(omega) * sin(kappa);
	geoRef.mat[0][2] = -cos(omega) * sin(phi) * cos(kappa) + sin(omega) * sin(kappa);
	geoRef.mat[1][0] = -cos(phi) * sin(kappa);
	geoRef.mat[1][1] = -sin(omega) * sin(phi) * sin(kappa) + cos(omega) * cos(kappa);
	geoRef.mat[1][2] = cos(omega) * sin(phi) * sin(kappa) + sin(omega) * cos(kappa);
	geoRef.mat[2][0] = sin(phi);
	geoRef.mat[2][1] = -sin(omega) * cos(phi);
	geoRef.mat[2][2] = cos(omega) * cos(phi);

	//open the bundler.out file needed to determine photo id and xy photo position
	inFile.open((path + "/bundle/bundle.out").c_str());
	if(!inFile) {
		cout << "bundle.out could not be opened." << endl;
		cout << "please ensure file path is correct" << endl;
		exit(1);
	}

	//get camera count and point count
	//skip camera details 
	string ignoreString;
	getline(inFile, ignoreString);
	int camCount, pointCount;
	inFile >> camCount >> pointCount;
	for(int i = 0; i < camCount * 15; i++) {
		inFile >> ignoreDouble;
	}

	double point[3], worldPoint[3];
	int viewCount, camIndex, ignoreInt;
	int color[3];

	//generate new .ply file to store the extra information
	ofstream outPlyFile((path + "/" + filename + ".ply").c_str());
	outPlyFile << "ply" << endl;
	outPlyFile << "format ascii 1.0" << endl;
	outPlyFile << "element vertex " << pointCount << endl;
	outPlyFile << "property float x" << endl;
	outPlyFile << "property float y" << endl;
	outPlyFile << "property float z" << endl;
	outPlyFile << "property uchar red" << endl;
	outPlyFile << "property uchar green" << endl;
	outPlyFile << "property uchar blue" << endl;
	outPlyFile << "property int camera_index" << endl;
	outPlyFile << "property float image_x_coord" << endl;
	outPlyFile << "property float image_y_coord" << endl;
	outPlyFile << "end_header" << endl;

	double imageCoords[2];

	//per point, output transformed point along with photo info from
	//first photo in the list of photos that include the point
	for(int i = 0; i < pointCount; i++) {
		inFile >> point[0] >> point[1] >> point[2] >> color[0] >> color[1] >> color[2] >>
				  viewCount >> camIndex >> ignoreInt >> imageCoords[0] >> imageCoords[1];

		for(int j = 0; j < viewCount - 1; j++) {
			inFile >> ignoreInt >> ignoreInt >> ignoreDouble >> ignoreDouble;
		}

		fromLocalToWorld(geoRef, point, worldPoint);

		outPlyFile << worldPoint[0] << " " << worldPoint[1] << " " << worldPoint[2] << " " <<
					  color[0] << " " << color[1] << " " << color[2] << " " <<
					  camIndex << " " << ((imageCoords[0] / 3648.0) + 0.5) << " " << (0.5 - (imageCoords[1] / 2736.0)) << endl;
	}

	inFile.close();
	outPlyFile.close();
}

//georeference a point per the cloud's specific georefence transform
void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]) {
	worldPoint[0] = geoRef.s * (geoRef.mat[0][0] * localPoint[0] + geoRef.mat[1][0] * localPoint[1] + geoRef.mat[2][0] * localPoint[2]);
	worldPoint[1] = geoRef.s * (geoRef.mat[0][1] * localPoint[0] + geoRef.mat[1][1] * localPoint[1] + geoRef.mat[2][1] * localPoint[2]);
	worldPoint[2] = abs(geoRef.s) * (geoRef.mat[0][2] * localPoint[0] + geoRef.mat[1][2] * localPoint[1] + geoRef.mat[2][2] * localPoint[2]) + geoRef.Tz;
}