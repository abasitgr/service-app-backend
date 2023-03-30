const { OKSuccess } = require("../utils/success");
const { BadRequestError, NotFoundError } = require("../utils/error");
const ChatService = require('../service/chat.service');

module.exports.respond = function (socket) {


  // chat socket functions

  socket.on('join_admin', () => {
    socket.join('pendingRoom');
    socket.emit('join_admin_response', 'pending room joined by admin!');
  })

  console.log("new user joined", socket.id)
  socket.on("create_room", async (data) => {
    console.log("data", data);

    let response = await createRoom(data);
    console.log("create_room response", response)

    if (response.status === 200) {
      socket.emit('create_room_response', response);
      socket.broadcast.to('pendingRoom').emit('new_pending_chat', response);
      socket.join(response.data.id);
    }
    else {
      socket.emit('create_room_response', response);
    }


  });

  socket.on("accept_room", async (data) => {
    console.log("data", data);

    let response = await acceptChat(data);
    console.log("accept_room response", response)

    if (response.status === 200) {
      socket.emit('accept_room_response', response);
      socket.broadcast.to('pendingRoom').emit('new_pending_chat', response);
      socket.join(response.data.id);
    }
    else {
      socket.emit('accept_room_response', response);
    }


  });

  socket.on("join_room", async (data) => {
    console.log("data", data);

    let response = await joinRoom(data);
    console.log("join_room response", response)

    if (response.status === 200) {
      socket.emit('join_room_response', response);
      socket.join(response.data.id);
    }
    else {
      socket.emit('join_room_response', response);
    }
  });

  socket.on("end_chat", async (data) => {
    console.log("data", data);

    let response = await endChat(data);
    console.log("end_chat response", response)

    if (response.status === 200) {
      socket.emit('end_chat_response', response);
      socket.to(data.chatId).emit('end_chat_response', response);
    }
    else {
      socket.emit('end_chat_response', response);
    }
  });

  socket.on("send_message", async (data) => {
    const { chatId } = data;

    let response = await sendMessage(data);
    console.log("send_message response", response)
    response['chatId'] = chatId;
    response['socketId'] = socket.id;
    if (response.status === 200) {
      socket.emit('send_message_response', response)
      socket.broadcast.to(chatId).emit('receive_message', response);
    }
    else {
      socket.emit('send_message_response', response);
    }
  });


  socket.on('closeme', () => {
    socket.disconnect();
  })

  // chat socket functions ended


  //job socket functions

  socket.on('join_job', (data) => {
    console.log(`job ${data.jobId} screen joined by ${data.type}`);
    socket.join(data.jobId);
    socket.emit('join_job_response', 'joined successfully!');
  });

  socket.on('doAction', (data) => {
    console.log(`action performed for job ${data.jobId} by supplier`);
    socket.broadcast.to(data.jobId).emit('doActionResponse', { status: true });
    socket.emit('doActionResponse', { status: true });

  });

  //job socket functions ended


  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED", socket.id);
  });






}


async function createRoom(data) {
  try {
    const result = await new ChatService().createRoom(data)
    return result;
  }

  catch (err) {
    console.log("err", err)
    return err;
  }
}

async function acceptChat(data) {
  try {
    const result = await new ChatService().acceptChat(data)
    return result;
  }

  catch (err) {
    console.log("err", err)
    return err;
  }
}

async function endChat(data) {
  try {
    const result = await new ChatService().endChat(data)
    return result;
  }

  catch (err) {
    console.log("err", err)
    return err;
  }
}

async function joinRoom(data) {
  try {
    const result = await new ChatService().joinRoom(data)
    return result;
  }

  catch (err) {
    console.log("err", err)
    return err;
  }
}

async function sendMessage(data) {
  try {
    const result = await new ChatService().sendMessage(data)
    return result;
  }

  catch (err) {
    console.log("err", err)
    return err;
  }
}


module.exports.getAll = async (req, res) => {
  try {
    const allChats = await new ChatService().getAll(req)
    let response;
    if (allChats.chats[0].data.length) {
      response = new OKSuccess("Successfully Retrive the chats", allChats);
    }
    else {
      response = new NotFoundError({ msg: "No chats in the database" });
    }

    console.log("rr", response)
    return res.status(response.status).send(response);
  } catch (err) {
    console.log("err" + err)
    return res.status(err.status).send(err)
  }
}

module.exports.getEnd = async (req, res) => {
  try {
    const allChats = await new ChatService().getEnd(req)
    let response;
    if (allChats.chats[0].data.length) {
      response = new OKSuccess("Successfully Retrive the chats", allChats);
    }
    else {
      response = new NotFoundError({ msg: "No chats in the database" });
    }

    console.log("rr", response)
    return res.status(response.status).send(response);
  } catch (err) {
    console.log("err" + err)
    return res.status(err.status).send(err)
  }
}

module.exports.openChats = async (req, res) => {
  try {
    const allChats = await new ChatService().openChats(req)
    let response;
    if (allChats.chats[0].data.length) {
      response = new OKSuccess("Successfully Retrive the chats", allChats);
    }
    else {
      response = new NotFoundError({ msg: "No chats in the database" });
    }

    console.log("rr", response)
    return res.status(response.status).send(response);
  } catch (err) {
    console.log("err" + err)
    return res.status(err.status).send(err)
  }
}

module.exports.getOne = async (req, res) => {
  try {
    const chats = await new ChatService().getOne(req)
    let response = new OKSuccess("Successfully Retrive the chats", chats);
    return res.status(response.status).send(response);
  } catch (err) {
    return res.status(err.status).send(err)
  }
}

module.exports.getOldProblems = async (req, res) => {
  try {
    const chats = await new ChatService().getOldProblems(req)
    let response;
    if (chats.chats[0].data.length) {
      response = new OKSuccess("Successfully Retrive the chats", chats);
    }
    else {
      response = new NotFoundError({ msg: "No chats in the database" });
    }

    return res.status(response.status).send(response);
  } catch (err) {
    return res.status(err.status).send(err)
  }
}





