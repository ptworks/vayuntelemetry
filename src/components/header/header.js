import React from 'react'
import vayunlogo from '../../assets/images/vayun1.png'
const Header = () => {
  return (
    <>
    <img src={vayunlogo} className='w-[100px] h-[100px] absolute top-1 left-1'/>
    <div className="flex gap-2 bg-[#ffcc22]">
        <div className="w-[110px]">
            <p className="h-[110px]"></p>
        </div>
        <div>
            <div className="h-[53px]"></div>
            <h1 className='text-2xl font-sans'><span className='text-orange-100 font-bold'>VAYUN</span><span className="text-2xl text-black-700 ml-2">TELEMETRY</span></h1>
        </div>
    </div>

    </>
  )
}
export default Header