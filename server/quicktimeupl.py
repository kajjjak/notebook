import ftplib
from os import listdir
from os.path import isfile, join
mypath = "./"
onlyfiles = [];

for f in listdir(mypath):
	if isfile(join(mypath,f)):
		if f.startswith("tmp_"):
			onlyfiles.append(f)

for f in onlyfiles:
	session = ftplib.FTP('agame.webfactional.com','user','pass')
	file = open(f,'rb')                  # file to send
	clean_name = f.replace("tmp_", "")
	session.storbinary('STOR webapps/media/notebook_files/' + clean_name, file)     # send the file
	file.close()                                    # close file and FTP
	session.quit()