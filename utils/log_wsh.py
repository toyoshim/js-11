#
# Sample logging module for pywebsocket 0.5.2
#
from mod_pywebsocket import msgutil

def web_socket_do_extra_handshake(request):
    pass

def web_socket_transfer_data(request):
    file = open("/tmp/wslog.txt", "w")
    while True:
        line = msgutil.receive_message(request)
        file.write(line + "\n")

