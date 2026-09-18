import React from 'react'
import { BsRobot } from 'react-icons/bs'

function Footer() {
  return (
    <div className='flex justify-center px-4 pb-8 pt-4'>
      <div className='w-full max-w-6xl bg-[#16201a] text-white rounded-[22px] py-9 px-6 text-center'>
        <div className='flex justify-center items-center gap-3 mb-3'>
            <div className='bg-[#d7f36b] text-[#16201a] p-2 rounded-xl'><BsRobot size={16}/></div>
            <h2 className='font-semibold'>QuantumAI</h2>
        </div>
        <p className='text-white/60 text-sm max-w-xl mx-auto'>
  AI-powered interview preparation platform designed to improve
          communication skills, technical depth and professional confidence.
        </p>


      </div>
    </div>
  )
}

export default Footer
