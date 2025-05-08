import React, { useState, useEffect, useRef } from 'react';
import Nav from '../leftnav/navigation';
import map from '../../assets/images/map1.png';

const Content = () => {
  const [globalPosition, setGlobalPosition] = useState(null);
  const [attitude, setAttitude] = useState(null);
  const [batteryStatus, setBatteryStatus] = useState(null);
  const [vfrHud, setVfrHud] = useState(null);
  const [frame, setFrame] = useState(null);
  const [frameUrl, setFrameUrl] = useState(null);

  const telemetryWSRef = useRef(null);
  const videoWSRef = useRef(null);
  const imgRef = useRef(null);

  // Connect to Telemetry WebSocket (Port 8080)
  useEffect(() => {
    telemetryWSRef.current = new WebSocket('ws://100.89.116.48:8080');

    telemetryWSRef.current.onopen = () => {
      console.log('Connected to Telemetry WebSocket');
    };

    telemetryWSRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Telemetry Data:', data);

        switch (data.mavpackettype) {
          case 'GLOBAL_POSITION_INT':
            setGlobalPosition(data);
            break;
          case 'ATTITUDE':
            setAttitude(data);
            break;
          case 'SYS_STATUS':
            setBatteryStatus(data);
            break;
          case 'VFR_HUD':
            setVfrHud(data);
            break;
          case 'emergency': 
            console.log('Emergency event received:', data.payload);
            break;
          default:
            console.log('Unknown Telemetry Type:', data.mavpackettype);
        }
      } catch (error) {
        console.error('Error parsing telemetry data:', error);
      }
    };

    telemetryWSRef.current.onerror = (error) => {
      console.error('Telemetry WebSocket error:', error);
    };

    telemetryWSRef.current.onclose = () => {
      console.log('Telemetry WebSocket closed');
    };

    return () => {
      telemetryWSRef.current.close();
    };
  }, []);

  // Connect to Video Stream WebSocket (Port 8081)
  // Connect to Video Stream WebSocket
  useEffect(() => {
    videoWSRef.current = new WebSocket('ws://100.89.116.48:8081');

    videoWSRef.current.binaryType = 'arraybuffer'; // Important for receiving raw binary data

    videoWSRef.current.onopen = () => {
      console.log('Connected to Video WebSocket');
    };

    videoWSRef.current.onmessage = (event) => {
      const arrayBuffer = event.data;
      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });

      const url = URL.createObjectURL(blob);

      if (imgRef.current) {
        imgRef.current.src = url;
      }

      // Cleanup previous frame URL to avoid memory leak
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
      
      setFrameUrl(url);
    };

    videoWSRef.current.onerror = (error) => {
      console.error('Video WebSocket error:', error);
    };

    videoWSRef.current.onclose = () => {
      console.log('Video WebSocket closed');
    };

    return () => {
      videoWSRef.current.close();
    };
  }, [frameUrl]);
  
  return (
    <div className='flex-1'>
        <div className='flex gap-2'>
            <div className='border-r-2 border-black w-[60px] h-[75vh] bg-[#ffcc22] mt-3'>
                <Nav />
            </div>
           
            <div className='mt-3'>
                <div className='flex gap-2 min-h-[15vh] text-left'>
                {globalPosition ? (
                    <div className='flex gap-2 min-h-[15vh] text-left'>
                    <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>Latitude</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>{globalPosition.lat / 1e7}</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-1 bg-[#ffcc22]">
                        <p className='text-sm'>Longitude</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>{globalPosition.lon / 1e7}</p>
                    </div>
                    <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>Altitude</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>{globalPosition.alt/1000} m</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-1 bg-[#ffcc22]">
                        <p className='text-sm'>Heading</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>{globalPosition.hdg / 100.0}°</p>
                    </div> </div>):( <p>Waiting for telemetry data...</p>) }
                    {/* <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>Pitch</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>14.6</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-2 bg-[#ffcc22]">
                        <p className='text-sm'>Yaw</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>24.6</p>
                    </div> */}
                </div>
                <div className='flex gap-2 min-h-[40vh] text-left mt-2'>
                    <div className="w-[46.7vw] rounded-md border-r-2  border-black p-2">
                       <p className='font-bold'>Position</p>
                       <div style={{ width: '100%', height: 'auto', textAlign: 'center' }}>
  {frameUrl ? (
    <img
      src={frameUrl}
      alt="Live Drone Video"
      style={{ maxWidth: '100%', height: 'auto', border: '2px solid #ccc', borderRadius: '8px' }}
    />
  ) : (
    <p>Loading video stream...</p>
  )}
</div>
                    </div>
                    <div className="w-[46.7vw] border-l-2  border-black rounded-md p-2">
                        <p className='font-bold'>Artificial horizon</p>
                        <img src={map} className='h-[250px] w-[600px]'/>
                    </div>
                </div>
                <div className='flex gap-2 min-h-[15vh] text-left mt-2'>
                    <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>RX Channel 1</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>1916.8</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-1 bg-[#ffcc22]">
                        <p className='text-sm'>RX Channel 2</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>1390.4</p>
                    </div>
                    <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>RX Channel 3</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>1046.2</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-1 bg-[#ffcc22]">
                        <p className='text-sm'>RX Channel 4</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>1359.6</p>
                    </div>
                    <div className="w-[15.112vw] rounded-md border-t-2 border-b-2 border-black p-1 bg-[#ffcc22]">
                       <p className='text-sm'>RX Channel 5</p>
                       <p className='text-2xl font-bold text-center pt-2 text-white'>1854.3</p>
                    </div>
                    <div className="w-[15.112vw] border-t-2 border-b-2 border-black rounded-md p-2 bg-[#ffcc22]">
                        <p className='text-sm'>RX Channel 6</p>
                        <p className='text-2xl font-bold text-center pt-2 text-white'>1348.6</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
export default Content