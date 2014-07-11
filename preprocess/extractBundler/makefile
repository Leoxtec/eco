CC = /usr/bin/g++
CFLAGS =  -Wall -O2
LDFLAGS = -lm

# name of the executable to be created
PROJECT = convertFromBundler

# list of all .c files
SRCS = driver.cpp

#list of all .h files
HDRS = 

# list of .o files
OBJS = driver.o

# the first rule is the default rule
# build the executable from the .o files
$(PROJECT) : $(OBJS)
	$(CC) $(CFLAGS) $(LDFLAGS) $(OBJS) -o $(PROJECT)

# a separate rule to compile each .c file
driver.o: driver.cpp
	$(CC) $(CFLAGS) -c driver.cpp

# some handy commands that you can "make"
clean:
	rm -f core* $(PROJECT) $(OBJS)

cleaner: clean
	rm -f #* *~