import React, { useState } from 'react'
import { FaArrowLeft, FaCheckCircle, FaBolt, FaCrown, FaGem } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { motion } from "motion/react";
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Pricing() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const dispatch = useDispatch()

  const plans = [
    {
      id: "free",
      name: "Welcome plan",
      price: "₹0",
      credits: 499,
      description: "Perfect for beginners starting interview preparation.",
      features: [
        "499 welcome credits",
        "Technical and HR interviews",
        "Difficulty level selection",
        "Performance reports and history",
      ],
      icon: FaBolt,
      eyebrow: "Start here",
      default: true,
    },
    {
      id: "basic",
      name: "Practice top-up",
      price: "₹100",
      credits: 150,
      description: "For focused practice when you want a few extra sessions on demand.",
      features: [
        "150 additional credits",
        "Resume-based questions",
        "Voice interview simulation",
        "Detailed AI feedback",
      ],
      icon: FaGem,
      eyebrow: "Keep practicing",
    },
    {
      id: "pro",
      name: "Serious prep top-up",
      price: "₹500",
      credits: 650,
      description: "For candidates building consistency across multiple interview rounds.",
      features: [
        "650 additional credits",
        "Unlimited history tracking",
        "Skill and score trends",
        "Advanced AI feedback",
      ],
      icon: FaCrown,
      eyebrow: "Go deeper",
      badge: "Best Value",
    },
  ];



  const handlePayment = async (plan) => {
    try {
      setLoadingPlan(plan.id)

      const amount =  
      plan.id === "basic" ? 100 :
      plan.id === "pro" ? 500 : 0;

      const result = await axios.post(ServerUrl + "/api/payment/order" , {
        planId: plan.id,
        amount: amount,
        credits: plan.credits,
      },{withCredentials:true})
      

      const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: result.data.amount,
      currency: "INR",
      name: "QuantumAI",
      description: `${plan.name} - ${plan.credits} Credits`,
      order_id: result.data.id,

      handler:async function (response) {
        const verifypay = await axios.post(ServerUrl + "/api/payment/verify" ,response , {withCredentials:true})
        dispatch(setUserData(verifypay.data.user))

          alert("Payment Successful 🎉 Credits Added!");
          navigate("/")

      },
      theme:{
        color: "#10b981",
      },

      }

      const rzp = new window.Razorpay(options)
      rzp.open()

      setLoadingPlan(null);
    } catch (error) {
     console.log(error)
     setLoadingPlan(null);
    }
  }



  return (
    <div className='min-h-screen bg-[#f5f7f2] py-8 md:py-12 px-4 md:px-6 overflow-hidden'>

      <div className='hero-grid relative max-w-6xl mx-auto rounded-4xl border border-[#dce5d7] px-5 py-10 md:px-10 md:py-12'>
        <div className='absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#d7f36b]/35 blur-3xl' />
      <div className='relative max-w-3xl mx-auto mb-12 flex items-start gap-4'>

        <button onClick={() => navigate("/")} title='Back to home' className='mt-1 p-3.5 rounded-2xl bg-white border border-[#e1e9df] shadow-sm hover:shadow-md transition'>
          <FaArrowLeft className='text-[#526159]' />
        </button>

        <div className="text-center w-full">
          <p className='text-[#3f772f] text-xs font-bold tracking-[0.18em] mb-3'>POWER YOUR PRACTICE</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.05em] text-[#16201a]">
            Choose your pace
          </h1>
          <p className="text-[#526159] mt-4 text-base md:text-lg">
            Start with your welcome credits, then top up when your next opportunity is on the horizon.
          </p>
        </div>
      </div>

      <div className='relative max-w-3xl mx-auto mb-8 flex flex-wrap justify-center gap-2 text-xs font-semibold text-[#526159]'>
        <span className='rounded-full border border-[#dce5d7] bg-white/70 px-4 py-2'>50 credits = 1 AI interview</span>
        <span className='rounded-full border border-[#dce5d7] bg-white/70 px-4 py-2'>No subscription</span>
        <span className='rounded-full border border-[#dce5d7] bg-white/70 px-4 py-2'>Credits never expire</span>
      </div>

      <div className='relative grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto items-stretch'>

        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id

          return (
            <motion.div key={plan.id}
              whileHover={!plan.default && { scale: 1.03 }}
              onClick={() => !plan.default && setSelectedPlan(plan.id)}

              className={`relative rounded-3xl p-7 md:p-8 transition-all duration-300 border flex flex-col min-h-117.5 
                ${isSelected
                  ? "border-[#3f9b63] shadow-[0_20px_45px_rgba(63,155,99,0.16)] bg-white"
                  : "border-[#e1e9df] bg-white shadow-sm"
                }
                ${plan.default ? "cursor-default" : "cursor-pointer"}
              `}
            >

              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-[#079f6e] text-white text-xs px-3.5 py-1.5 rounded-full shadow-sm font-semibold">
                  {plan.badge}
                </div>
              )}

              {/* Default Tag */}
              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                  Included
                </div>
              )}

              <div className='flex items-center gap-3 mb-5'>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${plan.default ? 'bg-[#d7f36b] text-[#16201a]' : 'bg-[#eff9e8] text-[#3f772f]'}`}>
                  <plan.icon size={17} />
                </div>
                <div>
                  <p className='text-[10px] uppercase tracking-[0.16em] font-bold text-[#3f772f]'>{plan.eyebrow}</p>
                  <h3 className="text-xl font-extrabold tracking-[-0.03em] text-[#16201a]">
                {plan.name}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-[-0.04em] text-[#079f6e]">
                  {plan.price}
                </span>
                <p className="text-[#718078] mt-1 text-sm">
                  {plan.credits} credits <span className='text-[#b0bbb3]'>/</span> about {Math.floor(plan.credits / 50)} interviews
                </p>
              </div>

              {/* Description */}
              <p className="text-[#718078] mt-4 text-sm leading-relaxed min-h-12">
                {plan.description}
              </p>

              {/* Features */}
              <div className="mt-6 space-y-3 text-left flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <FaCheckCircle className="text-[#06b981] text-sm shrink-0" />
                    <span className="text-[#526159] text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {!plan.default &&
                <button
                disabled={loadingPlan === plan.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) {
                      setSelectedPlan(plan.id)
                    } else {
                      handlePayment(plan)
                    }
                  }} className={`w-full mt-8 py-3 rounded-xl font-semibold transition ${isSelected
                    ? "bg-[#16201a] text-white hover:bg-[#3f772f]"
                    : "bg-[#eef2ee] text-[#526159] hover:bg-[#e9f9dd]"
                    }`}>
                  {loadingPlan === plan.id
                    ? "Processing..."
                    : isSelected
                      ? "Proceed to Pay"
                      : "Select Plan"}

                </button>
              }
            </motion.div>
          )
        })}
      </div>

    </div>
    </div>
  )
}

export default Pricing
