import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAdmission } from '../context/AdmissionContext';
import { buildApiUrl } from '../api/apiBase';

export default function AddFacultyPage() {
  const navigate = useNavigate();
  const { addFacultyApp } = useAdmission();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Step 2: Professional
    role: '',
    department: '',
    yearsOfExperience: '',
    // Step 3: Qualification
    highestQualification: '',
    specialization: '',
    university: '',
    // Step 4: Documents
    resume: null,
    certifications: null,
    // Step 5: Employment Type
    employmentType: '',
    // Step 6: Payment
    paymentMethod: '',
  });

  const [paymentDone, setPaymentDone] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
  });

  const steps = [
    { number: 1, title: 'Personal' },
    { number: 2, title: 'Professional' },
    { number: 3, title: 'Qualification' },
    { number: 4, title: 'Documents' },
    { number: 5, title: 'Employment' },
    { number: 6, title: 'Payment' },
    { number: 7, title: 'Review' },
  ];

  const handleInputChange = (e) =>{
    const { name, value } = e.target;
    let finalValue = value;

    // Enforce 10-digit phone number
    if (name === 'phone' || name === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev =>({ ...prev, [name]: finalValue }));
  };

  const handleFileChange = (e, fieldName) =>{
    const file = e.target.files?.[0];
    setFormData(prev =>({ ...prev, [fieldName]: file }));
  };

  const handlePaymentDetailsChange = (e) =>{
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      if (formattedValue.length >0) {
        formattedValue = formattedValue.match(/.{1,4}/g).join(' ');
      }
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setPaymentDetails(prev =>({ ...prev, [name]: formattedValue }));
  };

  const handleNext = () =>{
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () =>{
    if (currentStep >1) setCurrentStep(currentStep - 1);
  };

  const handlePayment = () =>{
    setShowPaymentDetails(true);
  };

  const handleCompletePayment = () =>{
    if (!formData.paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (formData.paymentMethod === 'Credit Card' || formData.paymentMethod === 'Debit Card') {
      if (!paymentDetails.cardHolderName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        alert('Please fill all card details');
        return;
      }
    } else if (formData.paymentMethod === 'UPI') {
      if (!paymentDetails.upiId) {
        alert('Please enter UPI ID');
        return;
      }
    }

    setShowPaymentDetails(false);
    setPaymentDone(true);
    setTimeout(() =>handleNext(), 2000);
  };

  const handleCancelPayment = () =>{
    setShowPaymentDetails(false);
    setPaymentDetails({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '', upiId: '' });
  };

  const handleSubmit = async () =>{
    // Validate required fields BEFORE submitting
    if (!formData.fullName || !formData.fullName.trim()) {
      alert(' Full Name is required');
      setIsLoading(false);
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      alert(' Email is required');
      setIsLoading(false);
      return;
    }
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert(' Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      alert(' Phone number is required');
      setIsLoading(false);
      return;
    }
    // Validate phone format (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert(' Phone number must be exactly 10 digits');
      setIsLoading(false);
      return;
    }
    if (!formData.dateOfBirth) {
      alert(' Date of Birth is required');
      setIsLoading(false);
      return;
    }
    if (!formData.role || !formData.role.trim()) {
      alert(' Designation is required');
      setIsLoading(false);
      return;
    }
    if (!formData.department || !formData.department.trim()) {
      alert(' Department is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const facultyData = {
      fullName: formData.fullName,
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      role: formData.role,
      designation: formData.role,
      department: formData.department,
      yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
      highestQualification: formData.highestQualification,
      qualification: formData.highestQualification,
      specialization: formData.specialization,
      university: formData.university,
      employmentType: formData.employmentType,
      paymentMethod: formData.paymentMethod,
      paymentStatus: 'Paid',
      status: 'Pending',
      type: 'faculty',
    };

    try {
      console.log(' Submitting faculty data:', facultyData);

      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() =>controller.abort(), 10000); // 10 second timeout

      const response = await fetch(buildApiUrl('/faculty/admission/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(' Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to save admission`;
        try {
          const errorData = await response.json();
          console.log(' Error response:', errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          console.log(' Could not parse error response:', e);
          // Error response is not JSON
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
        console.log(' Faculty application saved successfully:', result);
      } catch (parseError) {
        console.warn(' Response is not JSON, but submission was successful');
        result = { employeeId: 'FAC-' + Date.now(), id: 'FAC-' + Date.now() };
      }

      addFacultyApp(facultyData);
      
      const empId = result.employeeId || result.id || 'Processing';
      alert(` Faculty application submitted successfully!\n\nEmployee ID: ${empId}\n\nYour application is now under review.`);
      navigate('/admission');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(' Request timeout:', error);
        alert(' Connection timeout. Please check if backend server is running on port 8000.\n\nTroubleshoot:\n1. Start backend: python -m uvicorn main:app --host 0.0.0.0 --port 8000\n2. Check vite.config.js proxy settings\n3. Verify API base URL');
      } else if (error instanceof TypeError) {
        console.error(' Network error:', error);
        alert(' Network error - Failed to reach backend server.\n\nPlease ensure:\n1. Backend is running on port 8000\n2. No network firewall blocking\n3. API base URL is correctly configured');
      } else {
        console.error(' Error submitting faculty admission:', error);
        alert(` Error: ${error.message}`);
      }
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Add New Faculty"><div className="space-y-4">{/* Page Header */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-[#276221]/10 rounded-lg"><span className="material-symbols-outlined text-lg text-[#276221]">school</span></div><div><h1 className="text-lg font-bold text-gray-900">Add New Faculty</h1><p className="text-xs text-gray-600 mt-0.5">Step {currentStep} of 7: {steps[currentStep-1].title}</p></div></div><button
            onClick={() =>navigate('/add-member')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          ><span className="material-symbols-outlined text-base">arrow_back</span><span className="font-medium">Back</span></button></div>{/* Progress Bar */}
        <div className="bg-white rounded-lg shadow overflow-hidden"><div className="flex h-1.5">{steps.map((s) =>(
              <div
                key={s.number}
                className={`flex-1 transition-all duration-500 ${currentStep >= s.number ? 'bg-[#276221]' : 'bg-gray-200'}`}
              />))}
          </div></div>{/* Form Container */}
        <div className="bg-white rounded-lg shadow p-6"><div className="space-y-6">{/* Step 1: Personal */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label><input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#276221]/20" placeholder="Enter full name" /></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" placeholder="example@edu.com" /></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Phone <span className="text-red-500">*</span></label><input name="phone" value={formData.phone} onChange={handleInputChange} maxLength="10" pattern="[0-9]{10}" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" placeholder="10-digit number" /></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Date of Birth <span className="text-red-500">*</span></label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" /></div><div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-gray-700">Gender <span className="text-red-500">*</span></label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div></div></div>)}

            {/* Step 2: Professional */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Designation <span className="text-red-500">*</span></label><select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white"><option value="">Select Designation</option><option value="Lecturer">Lecturer</option><option value="Assistant Professor">Assistant Professor</option><option value="Associate Professor">Associate Professor</option><option value="Professor">Professor</option></select></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Department <span className="text-red-500">*</span></label><select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white"><option value="">Select Department</option>{['Computer Science', 'Mechanical Eng.', 'Electrical Eng.', 'Civil Engineering'].map(d =><option key={d}>{d}</option>)}
                    </select></div><div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-gray-700">Years of Experience <span className="text-red-500">*</span></label><input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" placeholder="e.g. 5" /></div></div></div>)}

            {/* Step 3: Qualification */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Highest Qualification <span className="text-red-500">*</span></label><select name="highestQualification" value={formData.highestQualification} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white"><option value="">Select Qualification</option><option value="B.Tech">B.Tech</option><option value="M.Tech">M.Tech</option><option value="MBA">MBA</option><option value="Ph.D.">Ph.D.</option></select></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Specialization <span className="text-red-500">*</span></label><input name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" placeholder="e.g. Artificial Intelligence" /></div><div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-gray-700">University <span className="text-red-500">*</span></label><input name="university" value={formData.university} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" placeholder="University name" /></div></div></div>)}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2"><span className="material-symbols-outlined text-orange-600 flex-shrink-0 text-lg">file_upload</span><p className="text-xs text-orange-700">Upload resume and certifications in PDF or image format</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Resume/CV <span className="text-red-500">*</span></label><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#276221] transition-colors cursor-pointer"><input type="file" onChange={(e) =>handleFileChange(e, 'resume')} className="hidden" id="resume" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /><label htmlFor="resume" className="cursor-pointer"><span className="material-symbols-outlined text-2xl text-gray-400 block mb-1">upload_file</span><p className="text-xs font-medium text-gray-700">{formData.resume ? formData.resume.name : 'Click to upload'}</p><p className="text-[10px] text-gray-500">PDF, DOC, or Image</p></label></div></div><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Certifications</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#276221] transition-colors cursor-pointer"><input type="file" onChange={(e) =>handleFileChange(e, 'certifications')} className="hidden" id="certifications" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /><label htmlFor="certifications" className="cursor-pointer"><span className="material-symbols-outlined text-2xl text-gray-400 block mb-1">attach_file</span><p className="text-xs font-medium text-gray-700">{formData.certifications ? formData.certifications.name : 'Click to upload'}</p><p className="text-[10px] text-gray-500">Optional</p></label></div></div></div></div>)}

            {/* Step 5: Employment */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="space-y-1"><label className="text-xs font-semibold text-gray-700">Employment Type <span className="text-red-500">*</span></label><select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white"><option value="">Select Employment Type</option><option value="Full-Time">Full-Time</option><option value="Part-Time">Part-Time</option><option value="Contract">Contract</option></select></div></div>)}

            {/* Step 6: Payment */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">{!paymentDone ? (
                  <><div className="space-y-3"><label className="text-xs font-semibold text-gray-700">Select Payment Method <span className="text-red-500">*</span></label><div className="grid grid-cols-1 gap-2">{['Credit Card', 'Debit Card', 'UPI', 'Net Banking'].map(method =>(
                          <label key={method} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-[#276221] transition-colors"><input type="radio" name="paymentMethod" value={method} checked={formData.paymentMethod === method} onChange={handleInputChange} className="w-4 h-4" /><span className="ml-2 text-sm font-medium text-gray-700">{method}</span></label>))}
                      </div></div><button onClick={handlePayment} className="w-full px-4 py-2 bg-[#276221] text-white text-sm rounded-lg hover:bg-[#1e4618] transition-colors font-medium">Proceed to Payment
                    </button></>) : (
                  <div className="text-center py-6"><div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3"><span className="material-symbols-outlined text-xl text-green-600">check_circle</span></div><p className="font-semibold text-gray-900 text-sm">Payment Successful!</p><p className="text-xs text-gray-600 mt-1">Redirecting to review...</p></div>)}
              </div>)}

            {/* Step 7: Review */}
            {currentStep === 7 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300"><div className="bg-[#276221]/5 border border-[#276221]/10 rounded-lg p-4"><h3 className="font-bold text-gray-900 text-sm">Review Your Information</h3><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"><div><p className="text-xs font-bold text-gray-400 uppercase">Personal Info</p><div className="mt-2 space-y-1"><div className="flex justify-between text-xs"><span className="text-gray-500">Name:</span><span className="font-semibold">{formData.fullName}</span></div><div className="flex justify-between text-xs"><span className="text-gray-500">Email:</span><span className="font-semibold">{formData.email}</span></div><div className="flex justify-between text-xs"><span className="text-gray-500">Phone:</span><span className="font-semibold">{formData.phone}</span></div></div></div><div><p className="text-xs font-bold text-gray-400 uppercase">Professional Info</p><div className="mt-2 space-y-1"><div className="flex justify-between text-xs"><span className="text-gray-500">Designation:</span><span className="font-semibold">{formData.role}</span></div><div className="flex justify-between text-xs"><span className="text-gray-500">Department:</span><span className="font-semibold">{formData.department}</span></div><div className="flex justify-between text-xs"><span className="text-gray-500">Experience:</span><span className="font-semibold">{formData.yearsOfExperience} years</span></div></div></div></div></div><button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#276221] text-white text-sm rounded-lg hover:bg-[#1e4618] disabled:opacity-50 transition-colors font-medium"
                >{isLoading ? 'Submitting...' : 'Complete Registration'}
                </button></div>)}

            {/* Payment Modal */}
            {showPaymentDetails && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full space-y-4"><h3 className="text-sm font-bold">Enter {formData.paymentMethod} Details</h3>{(formData.paymentMethod === 'Credit Card' || formData.paymentMethod === 'Debit Card') && (
                    <div className="space-y-3"><input type="text" name="cardHolderName" placeholder="Cardholder Name" value={paymentDetails.cardHolderName} onChange={handlePaymentDetailsChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" /><input type="text" name="cardNumber" placeholder="Card Number" value={paymentDetails.cardNumber} onChange={handlePaymentDetailsChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" /><div className="grid grid-cols-2 gap-3"><input type="text" name="expiryDate" placeholder="MM/YY" value={paymentDetails.expiryDate} onChange={handlePaymentDetailsChange} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" /><input type="text" name="cvv" placeholder="CVV" value={paymentDetails.cvv} onChange={handlePaymentDetailsChange} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" /></div></div>)}

                  {formData.paymentMethod === 'UPI' && (
                    <input type="text" name="upiId" placeholder="UPI ID (e.g. name@upi)" value={paymentDetails.upiId} onChange={handlePaymentDetailsChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" />)}

                  <div className="flex gap-2 pt-2"><button onClick={handleCancelPayment} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button onClick={handleCompletePayment} className="flex-1 px-3 py-2 bg-[#276221] text-white text-sm rounded-lg hover:bg-[#1e4618] transition-colors">Pay Now</button></div></div></div>)}

            {/* Form Actions */}
            {currentStep < 6 || (currentStep === 6 && paymentDone) ? (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200"><div>{currentStep >1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >← Previous
                    </button>)}
                </div><div className="flex gap-2">{currentStep < 7 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 py-2 bg-[#276221] text-white text-sm rounded-lg hover:bg-[#1e4618] transition-colors font-medium"
                    >Next →
                    </button>)}
                </div></div>) : null}
          </div></div></div></Layout>);
}
