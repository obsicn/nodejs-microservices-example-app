from functools import partial
from multiprocessing.dummy import Pool
from subprocess import Popen, PIPE

import sys

def child(cmd):
    p = Popen(cmd, stdout=PIPE, shell=True)
    out, err = p.communicate()
    return out, p.returncode

commands = []
command = "curl -s -w \"http_code = %{http_code}, time_total=%{time_total}\" -o /dev/null -k -X GET \"http://127.0.0.1:4000?weather="+sys.argv[1]+"&loop="+sys.argv[2]+"\""
for i in range(50):   # run curl commands in total
    commands.append(command)

pool = Pool(5) # Nummber of concurrent commands at a time

times = []
for i, (output, returncode) in enumerate(pool.imap(child, commands)):
    if returncode != 0:
       print("{} command failed: {}".format(i, returncode))
    else:
       print("{} success: {}".format(i, output))
       times.append(float(output.split(b'=')[2]))

print('Average: {}'.format(sum(times) / len(times) if times else 0))
