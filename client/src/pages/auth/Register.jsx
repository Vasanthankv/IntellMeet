import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Lock, Mail, User, Calendar, Briefcase,
  GraduationCap, Building2, ChevronRight, ChevronLeft,
  Phone, Globe, MapPin, CheckCircle, Users, Lightbulb, Heart
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const USER_TYPES = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'College / University learner',
    color: 'bg-blue-50 border-blue-300 text-blue-700',
    activeColor: 'bg-blue-600 border-blue-600 text-white',
    dot: 'bg-blue-500'
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    description: 'Corporate or freelance worker',
    color: 'bg-purple-50 border-purple-300 text-purple-700',
    activeColor: 'bg-purple-600 border-purple-600 text-white',
    dot: 'bg-purple-500'
  },
  {
    id: 'business',
    label: 'Business / Enterprise',
    icon: Building2,
    description: 'Team lead or company owner',
    color: 'bg-indigo-50 border-indigo-300 text-indigo-700',
    activeColor: 'bg-indigo-600 border-indigo-600 text-white',
    dot: 'bg-indigo-500'
  },
  {
    id: 'educator',
    label: 'Educator / Trainer',
    icon: Lightbulb,
    description: 'Teacher, professor or coach',
    color: 'bg-amber-50 border-amber-300 text-amber-700',
    activeColor: 'bg-amber-500 border-amber-500 text-white',
    dot: 'bg-amber-500'
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: Heart,
    description: 'Medical or healthcare worker',
    color: 'bg-red-50 border-red-300 text-red-700',
    activeColor: 'bg-red-500 border-red-500 text-white',
    dot: 'bg-red-500'
  },
  {
    id: 'other',
    label: 'Other',
    icon: Users,
    description: 'Any other category',
    color: 'bg-gray-50 border-gray-300 text-gray-700',
    activeColor: 'bg-gray-600 border-gray-600 text-white',
    dot: 'bg-gray-500'
  }
];

const STEPS = [
  { number: 1, title: 'Account' },
  { number: 2, title: 'Verify Age' },
  { number: 3, title: 'Profile Type' },
  { number: 4, title: 'Details' },
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const navigate = useNavigate();

  const { login } = useAuthStore();
  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm({ mode: 'onTouched' });

  const handleNext = async () => {
    let fields = [];
    if (step === 1) fields = ['name', 'email', 'password'];
    if (step === 2) fields = ['dob'];
    const valid = await trigger(fields);
    if (!valid) return;
    if (step === 3 && !selectedType) {
      toast.error('Please select your profile type to continue.');
      return;
    }
    setStep(s => s + 1);
  };

  const onSubmit = async (data) => {
    if (!selectedType) { toast.error('Please select your profile type.'); return; }
    try {
      setIsLoading(true);
      const res = await authService.register({ ...data, userType: selectedType });
      if (res.user && res.token) {
        login(res.user, res.token);
      }
      toast.success('Account created! Welcome to IntellMeet 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create your IntellMeet account</h2>
        <p className="mt-1 text-sm text-gray-500">Step {step} of {STEPS.length} — {STEPS[step - 1].title}</p>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.number}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                step > s.number ? 'bg-green-500 border-green-500 text-white' :
                step === s.number ? 'bg-primary-600 border-primary-600 text-white' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {step > s.number ? <CheckCircle className="w-4 h-4" /> : s.number}
              </div>
              <span className={`text-[10px] font-medium ${step === s.number ? 'text-primary-600' : 'text-gray-400'}`}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded mb-4 transition-all duration-500 ${step > s.number ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ===================== STEP 1: ACCOUNT BASICS ===================== */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type="text" placeholder="Enter your full name" className="pl-10"
                  {...register('name', { required: 'Full name is required' })}
                  error={errors.name?.message} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type="email" placeholder="you@example.com" className="pl-10"
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' } })}
                  error={errors.email?.message} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="pl-10 pr-10"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters required' } })}
                  error={errors.password?.message} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== STEP 2: AGE VERIFICATION ===================== */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <strong>Age Verification:</strong> IntellMeet requires users to be at least 13 years old. Your date of birth is used only for verification and will not be shared.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type="date" className="pl-10"
                  {...register('dob', {
                    required: 'Date of birth is required',
                    validate: (val) => {
                      const age = (new Date() - new Date(val)) / (365.25 * 24 * 3600 * 1000);
                      return age >= 13 || 'You must be at least 13 years old to use IntellMeet.';
                    }
                  })}
                  error={errors.dob?.message} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700"
                {...register('gender')}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="nonbinary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country / Region</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type="text" placeholder="e.g. India, United States" className="pl-10"
                  {...register('country', { required: 'Country is required' })}
                  error={errors.country?.message} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input type="tel" placeholder="+91 98765 43210" className="pl-10"
                  {...register('phone')} />
              </div>
            </div>
          </div>
        )}

        {/* ===================== STEP 3: USER TYPE SELECTION ===================== */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium">Which best describes you? This helps us personalise your IntellMeet experience.</p>
            <div className="grid grid-cols-2 gap-3">
              {USER_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = selectedType === type.id;
                return (
                  <button key={type.id} type="button" onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${isActive ? type.activeColor + ' shadow-md' : type.color}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold text-sm">{type.label}</span>
                    </div>
                    <p className={`text-xs leading-tight ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{type.description}</p>
                  </button>
                );
              })}
            </div>
            {!selectedType && <p className="text-xs text-red-500 mt-1">Please select your profile type.</p>}
          </div>
        )}

        {/* ===================== STEP 4: DETAILED PROFILE ===================== */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {(() => { const t = USER_TYPES.find(t => t.id === selectedType); const Icon = t?.icon || Users; return <><div className={`w-7 h-7 rounded-full flex items-center justify-center ${t?.dot || 'bg-gray-400'}`}><Icon className="w-4 h-4 text-white" /></div><span className="text-sm font-semibold text-gray-700">{t?.label} Profile</span></>; })()}
            </div>

            {/* Student-specific fields */}
            {selectedType === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University / School Name</label>
                  <div className="relative"><GraduationCap className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. MIT, IIT Delhi" className="pl-10"
                      {...register('institution', { required: 'Institution name is required' })} error={errors.institution?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                  <Input type="text" placeholder="e.g. Computer Science, Medicine"
                    {...register('field', { required: 'Field of study is required' })} error={errors.field?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('yearOfStudy', { required: true })}>
                    <option value="">Select Year</option>
                    <option>1st Year</option><option>2nd Year</option><option>3rd Year</option>
                    <option>4th Year</option><option>Postgraduate</option><option>PhD</option>
                  </select>
                </div>
              </>
            )}

            {/* Professional-specific fields */}
            {selectedType === 'professional' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <div className="relative"><Briefcase className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. Software Engineer, Designer" className="pl-10"
                      {...register('jobTitle', { required: 'Job title is required' })} error={errors.jobTitle?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company / Organisation</label>
                  <div className="relative"><Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. Google, Freelance" className="pl-10"
                      {...register('company', { required: 'Company name is required' })} error={errors.company?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('experience')}>
                    <option value="">Select experience</option>
                    <option>0-1 years</option><option>2-5 years</option><option>5-10 years</option><option>10+ years</option>
                  </select>
                </div>
              </>
            )}

            {/* Business-specific fields */}
            {selectedType === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company / Business Name</label>
                  <div className="relative"><Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. Acme Corp" className="pl-10"
                      {...register('company', { required: 'Company name is required' })} error={errors.company?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('role', { required: true })}>
                    <option value="">Select your role</option>
                    <option>CEO / Founder</option><option>CTO / Technical Lead</option>
                    <option>Manager / Team Lead</option><option>HR / Recruiter</option>
                    <option>Sales / Marketing</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('teamSize')}>
                    <option value="">Select team size</option>
                    <option>Just me</option><option>2-10</option><option>11-50</option>
                    <option>51-200</option><option>200+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative"><Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="url" placeholder="https://yourcompany.com" className="pl-10"
                      {...register('website')} /></div>
                </div>
              </>
            )}

            {/* Educator-specific fields */}
            {selectedType === 'educator' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution / Organisation</label>
                  <div className="relative"><GraduationCap className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. MIT OpenCourseWare" className="pl-10"
                      {...register('institution', { required: 'Institution is required' })} error={errors.institution?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Domain</label>
                  <Input type="text" placeholder="e.g. Mathematics, Public Speaking"
                    {...register('subject', { required: 'Subject is required' })} error={errors.subject?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typical Audience</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('audience')}>
                    <option value="">Select audience</option>
                    <option>School Students</option><option>University Students</option>
                    <option>Corporate Teams</option><option>General Public</option>
                  </select>
                </div>
              </>
            )}

            {/* Healthcare-specific fields */}
            {selectedType === 'healthcare' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialisation / Role</label>
                  <div className="relative"><Heart className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. Cardiologist, Nurse, Therapist" className="pl-10"
                      {...register('specialisation', { required: 'Specialisation is required' })} error={errors.specialisation?.message} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Clinic Name</label>
                  <div className="relative"><Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="e.g. Apollo Hospitals" className="pl-10"
                      {...register('hospital', { required: 'Hospital/Clinic name is required' })} error={errors.hospital?.message} /></div>
                </div>
              </>
            )}

            {/* Other fields */}
            {selectedType === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How will you use IntellMeet?</label>
                <textarea rows={3} placeholder="Tell us briefly how you plan to use IntellMeet..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  {...register('useCase', { required: 'Please describe your use case' })} />
                {errors.useCase && <p className="text-xs text-red-500 mt-1">{errors.useCase.message}</p>}
              </div>
            )}

            {/* Common: How did you hear about us */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about IntellMeet? <span className="text-gray-400 font-normal">(optional)</span></label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                {...register('referral')}>
                <option value="">Select an option</option>
                <option>Search Engine (Google, Bing)</option>
                <option>Social Media</option>
                <option>Friend / Colleague</option>
                <option>App Store</option>
                <option>Advertisement</option>
                <option>Blog / Article</option>
                <option>Other</option>
              </select>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" className="mt-1"
                {...register('terms', { required: 'You must agree to the terms to continue.' })} />
              <label htmlFor="terms" className="text-xs text-gray-600">
                I agree to IntellMeet's{' '}
                <Link to="/terms" className="text-primary-600 underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-primary-600 underline">Privacy Policy</Link>.
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 4 ? (
            <button type="button" onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              🎉 Complete Sign Up
            </Button>
          )}
        </div>
      </form>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">Sign in</Link>
      </div>
    </div>
  );
}
