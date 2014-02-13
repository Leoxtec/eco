#include <iostream>
#include <fstream>
#include <vector>
#include <string>
using namespace std;

struct geoRefTrans {
	double mat[3][3];
	double s, Tz;
};

void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]);

int main(int argc, const char* argv[]) {
	if(argc < 2) {
		cout << "please add working directory as command line argument" << endl;
		// current local dir = "../../pointpickingstuff/511_pics"
		exit(1);
	}
	string path(argv[1]);

	struct geoRefTrans geoRef;
	double omega, phi, kappa, ignoreDouble;
	ifstream inFile(path + "/georef_transform.txt");
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

	inFile.open(path + "/bundle.out");
	if(!inFile) {
		cout << "bundle.out could not be opened." << endl;
		cout << "please ensure file path is correct" << endl;
		exit(1);
	}
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

	ofstream outPlyFile(path + "/pmvs/models/point_pick_test.ply");
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

void fromLocalToWorld(struct geoRefTrans geoRef, const double localPoint[], double worldPoint[]) {
	worldPoint[0] = geoRef.s * (geoRef.mat[0][0] * localPoint[0] + geoRef.mat[1][0] * localPoint[1] + geoRef.mat[2][0] * localPoint[2]);
	worldPoint[1] = geoRef.s * (geoRef.mat[0][1] * localPoint[0] + geoRef.mat[1][1] * localPoint[1] + geoRef.mat[2][1] * localPoint[2]);
	worldPoint[2] = abs(geoRef.s) * (geoRef.mat[0][2] * localPoint[0] + geoRef.mat[1][2] * localPoint[1] + geoRef.mat[2][2] * localPoint[2]) + geoRef.Tz;
}