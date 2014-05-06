//main driver for generating the per point ecosynth browser data
//from a pmvs output
//per point data includes georeferenced position, original color and 
//photo reference (photo id plus xy position in the photo)
//this code needs to jump through some extra hoops to be able to generate the photo info

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <math.h>
#include <sstream>
#include <iomanip>
#include <stdio.h>
#include <stdlib.h>
using namespace std;

struct camera {
	double projection[3][4];
};

struct geoRefTrans {
	double mat[3][3];
	double s, Tz;
};

//prototypes
void calculateImageCoords(struct camera cam, const double point[], double imageCoords[]);
void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]);

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

	ifstream inFile;
	ostringstream oss;
	string ignoreString;
	int camCount = 0;
	oss << setfill('0');
	bool found = true;
	vector<struct camera> cams;
	struct camera currCam;

	//grab all the camera transforms needed to determine point location within a photo
	while(found) {
		oss << path << "/pmvs/txt/" << setw(8) << camCount++ << ".txt";
		inFile.open(oss.str().c_str());
		if(!inFile) {
			found = false;
		}
		else {
			getline(inFile, ignoreString);
			for(int i = 0; i < 3; i++) {
				for(int j = 0; j < 4; j++) {
					inFile >> currCam.projection[i][j];
				}
			}
			cams.push_back(currCam);
			inFile.close();
		}
		oss.seekp(0);
	}
	if(cams.empty()) {
		cout << "could not open pmvs .txt files (CONTOUR files)." << endl;
		cout << "please ensure file path is correct" << endl;
		exit(1);
	}

	//read in and store the georefence transform
	struct geoRefTrans geoRef;
	double omega, phi, kappa, ignoreDouble;
	inFile.open((path + "/georef_transform.txt").c_str());
	if(!inFile) {
		cout << "could not open georeference transform file." << endl;
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

	//open pmvs patch file to obtain the photo id for each point
	ifstream inPatchFile((path + "/pmvs/models/pmvs_options.txt.patch").c_str());
	if(!inPatchFile) {
		cout << "could not open .patch file" << endl;
		cout << "please ensure file path is correct" << endl;
		exit(1);
	}
	getline(inPatchFile, ignoreString);
	int pointCount;
	inPatchFile >> pointCount;
	getline(inPatchFile, ignoreString);
	getline(inPatchFile, ignoreString);
	double localPoint[3], worldPoint[3];
	int camIndex;

	//open the pmvs .ply file for each point's position and color
	ifstream inPlyFile((path + "/pmvs/models/pmvs_options.txt.ply").c_str());
	if(!inPlyFile) {
		cout << "could not open .ply file" << endl;
		cout << "please ensure file path is correct" << endl;
		exit(1);
	}
	getline(inPlyFile, ignoreString);
	while(ignoreString != "end_header") {
		getline(inPlyFile, ignoreString);
	}
	int color[3];
	float ignoreFloat;

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

	//per point, output transformed point along with photo info
	double imageCoords[2];
	for(int i = 0; i < pointCount; i++) {
		inPatchFile >> localPoint[0] >> localPoint[1] >> localPoint[2];
		for(int j = 0; j < 4; j++) {
			getline(inPatchFile, ignoreString);
		}
		inPatchFile >> camIndex;
		getline(inPatchFile, ignoreString);
		while(ignoreString != "PATCHS" && i < pointCount - 1) {
			getline(inPatchFile, ignoreString);
		}

		for(int j = 0; j < 6; j++) {
			inPlyFile >> ignoreFloat;
		}
		inPlyFile >> color[0] >> color[1] >> color[2];

		calculateImageCoords(cams[camIndex], localPoint, imageCoords);

		fromLocalToWorld(geoRef, localPoint, worldPoint);

		outPlyFile << worldPoint[0] << " " << worldPoint[1] << " " << worldPoint[2] << " ";
		outPlyFile << color[0] << " " << color[1] << " " << color[2] << " ";
		outPlyFile << camIndex << " " << imageCoords[0] << " " << imageCoords[1] << endl;
	}

	inPatchFile.close();
	inPlyFile.close();
	outPlyFile.close();
}

//deteremine image coordinates using pmvs camera transforms
//cacluation if provided by the pmvs documentation
void calculateImageCoords(struct camera cam, const double point[], double imageCoords[]) {
	double z = cam.projection[2][0] * point[0] + cam.projection[2][1] * point[1] + cam.projection[2][2] * point[2] + cam.projection[2][3];
	imageCoords[0] = (cam.projection[0][0] * point[0] + cam.projection[0][1] * point[1] + cam.projection[0][2] * point[2] + cam.projection[0][3]) / (z * 3648.0);
	imageCoords[1] = (cam.projection[1][0] * point[0] + cam.projection[1][1] * point[1] + cam.projection[1][2] * point[2] + cam.projection[1][3]) / (z * 2736.0);
}

//georeference a point per the cloud's specific georefence transform
void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]) {
	worldPoint[0] = geoRef.s * (geoRef.mat[0][0] * localPoint[0] + geoRef.mat[1][0] * localPoint[1] + geoRef.mat[2][0] * localPoint[2]);
	worldPoint[1] = geoRef.s * (geoRef.mat[0][1] * localPoint[0] + geoRef.mat[1][1] * localPoint[1] + geoRef.mat[2][1] * localPoint[2]);
	worldPoint[2] = abs(geoRef.s) * (geoRef.mat[0][2] * localPoint[0] + geoRef.mat[1][2] * localPoint[1] + geoRef.mat[2][2] * localPoint[2]) + geoRef.Tz;
}