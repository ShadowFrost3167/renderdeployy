import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import AssignmentIcon from '@mui/icons-material/Assignment';
import PhoneIcon from '@mui/icons-material/Phone';
import React, {useEffect, useRef, useState} from "react";
//allow user to quick copy string in page.(Below)
import {CopyToClipboard} from "react-copy-to-clipboard";
//P2P connection
import Peer from "simple-peer";
import io from "socket.io-client";
import "..src/App.css";


//create socket
const socket = io.connect("http://localhost:5000")



function App() {
        //user id
  const [ me, setMe ] = useState("")
  const [ stream, setStream ] = useState()
  const [ recievingCall, setReceivingCall ] = useState(false)
        //caller id
  const [ caller, setCaller ] = useState("")
  const [callerSignal, setCallerSignal ] = useState()
  const [callAccepted, setCallAccepted ] = useState(false)
         //room id
  const [idToCall, setIdToCall ] = useState("")
  const [callEnded, setCallEnded ] = useState(false)
  const [name, setName] = useState("")
  

  const myVideo = useRef()
  const userVideo = useRef()

  //disconnect video 
  const connectionRef = useRef()


  useEffect(()=>{
    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream)=>{
      //stream usage
      setStream(stream)
      myVideo.current.srcObject = stream
    })

    socket.on("me", (id)=>{
      setMe(id)
    })

    socket.on("callUser", (data)=>{
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })



  }, []);

  //enable calling other user
const callUser = (id) =>{
  //pass in things from simple-peer
  const peer = new Peer({
    initiator: true,
    trickle: false,
    stream: stream
  })

  peer.on("signal", (data)=>{
    socket.emit("callUser", {
      userToCall: id,
      signalData: data,
      from: me,
      name: name
    })
  })


  //set other users stream to the current src object for video
  peer.on("stream", (stream) =>{
    userVideo.current.srcObject = stream
  })


  //add call accepted socket
  socket.on("callAccepted", (signal)=>{
    setCallAccepted(true)
    peer.signal(signal)
  })

  //when we can end the call we can disable the feed
  connectionRef.current = peer
};


//add ability to answer call
const answerCall = () => {
  setCallAccepted(true)
  const peer = new Peer({
    initiator: false,
    trickle: false,
    stream: stream
  })

  peer.on("signal", (data)=>{
    socket.emit("answerCall", {signal: data, to: caller})
  })

  //set other user stream
  peer.on("stream", (stream)=>{
    userVideo.current.srcObject = stream
  })


  peer.signal(callerSignal)
  connectionRef.current = peer
}

//ability to leave call when desired
const leaveCall = () =>{
  setCallEnded(true)
  connectionRef.current.destroy()
}








  return (
    <>
      <h1>Call Center</h1>
      <div className="container">
      <div className="video-container">
          <div className="video">
          {/* if theres a stream then plays users video as the stream */}
          {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "500px" }} />}
          </div>
          <div className="video">
          {/* if the call is current then it displays the other users video as stream */}
            {callAccepted && !callEnded ?
            <video playsInline ref={userVideo} autoPlay style={{width: "500px"}}/>:
            null }
          </div>
      </div>


      {/* user id name */}
      <div className="myId">
        <TextField
        id = "filled-basic"
        label = "Name"
        variant="filled"
        value={name}
        onChange={(e)=> setName(e.target.value)}
        style={{marginBottom: "20px"}}
        />

        {/* enable user to copy their own id to send to other users */}
      <CopyToClipboard text={me} style={{marginBottom: "2rem"}}>
        <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large"/>}>
          Copy ID
        </Button>
      </CopyToClipboard>


      {/* place to put id of the person we want to call */}
      <TextField
      id = "filled-basic"
      label = "ID to call"
      variant= "filled"
      value= { idToCall }
      onChange={(e)=>setIdToCall(e.target.value)}
      />

      
      <div className="call-button">
        {callAccepted && !callEnded ? (
          <Button variant="contained" color="secondary" onClick={leaveCall}>Smell You Later!</Button>
        ):(
          <IconButton color="primary" aria-label="call" onClick={()=> callUser(idToCall)}>
            <PhoneIcon fontSize="large"/>
          </IconButton>
        
        )}
        {idToCall}
      </div>
      </div>
      </div>

      {recievingCall && !callAccepted ?(
        <div className="caller">
          <h1> {name} is trying to reach you!</h1>
          <Button variant="contained" color="primary" onClick={answerCall}>
            Pick Up
          </Button>
        </div>
      ) : null }
    </>
  )
}

export default App;
