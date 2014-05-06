CC = /usr/bin/g++
CFLAGS =  -Wall -O2 -I/usr/include/cppconn
LDFLAGS = -L/usr/lib -lmysqlcppconn

# name of the executable to be created
PROJECT = BuildQuadTree

# list of all .c files
SRCS = QuadTreeDriver.cpp

#list of all .h files
HDRS = Quadtree.h

# list of .o files
OBJS = QuadTreeDriver.o

# the first rule is the default rule
# build the executable from the .o files
$(PROJECT) : $(OBJS)
	$(CC) $(CFLAGS) -o $(PROJECT) $(OBJS) $(LDFLAGS)

# a separate rule to compile each .c file
QuadTreeDriver.o: QuadTreeDriver.cpp Quadtree.h
	$(CC) $(CFLAGS) -c QuadTreeDriver.cpp

# some handy commands that you can "make"
clean:
	rm -f core* $(PROJECT) $(OBJS)

cleaner: clean
	rm -f #* *~