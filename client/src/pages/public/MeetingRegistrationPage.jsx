import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Video, Calendar, Clock, Globe, Shield, CheckCircle2, 
  AlertCircle, Lock, ArrowRight, Copy, Check, User
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingRegistrationPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [customAnswers, setCustomAnswers] = useState({});

  // Success State
  const [registrationResult, setRegistrationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMeetingInfo = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/meetings/public/${meetingId}`);
        const data = await res.json();
        if (data.success && data.meeting) {
          setMeeting(data.meeting);
        } else {
          toast.error(data.message || 'Meeting not found');
        }
      } catch (err) {
        console.error('Error loading meeting for registration:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetingInfo();
  }, [meetingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      toast.error('Email addresses do not match');
      return;
    }

    setSubmitting(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Format custom answers
    const answersPayload = Object.entries(customAnswers).map(([question, answer]) => ({
      question,
      answer
    }));

    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: email.trim(),
          organization: organization.trim(),
          customAnswers: answersPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setRegistrationResult(data);
        sessionStorage.setItem('intellmeet_guest_name', fullName);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to submit registration');
      }
    } catch (err) {
      toast.error('Network error submitting registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-500">
      Loading meeting details...
    </div>
  );

  if (!meeting) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Registration Unavailable</h1>
      <p className="text-xs text-gray-500 max-w-sm mb-6">This meeting either does not exist or has expired.</p>
      <Link to="/" className="text-xs font-bold text-blue-600 hover:underline">
        Back to IntellMeet Home
      </Link>
    </div>
  );

  const cleanRoomId = meeting.meetingId ? meeting.meetingId.replace(/\s/g, '') : meetingId;
  const personalJoinUrl = `http://localhost:5173/meetings/${cleanRoomId}/room`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-12 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            IM
          </div>
          <span className="text-blue-600 font-extrabold text-xl tracking-tight">IntellMeet</span>
        </Link>
        <span className="text-xs text-gray-500 font-medium">Attendee Registration Portal</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Header Card Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 md:p-8">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/15 uppercase tracking-wider mb-2 inline-block">
              Webinar & Meeting Registration
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              {meeting.title}
            </h1>
            {meeting.description && (
              <p className="text-xs text-blue-200 leading-relaxed mb-4">{meeting.description}</p>
            )}

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-blue-100 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{meeting.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{meeting.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>{meeting.timezone || '(UTC+05:30) India Standard Time'}</span>
              </div>
            </div>
          </div>

          {/* Registration Form OR Success Screen */}
          <div className="p-6 md:p-8">
            
            {registrationResult ? (
              /* Success Confirmation Screen */
              <div className="space-y-6 text-center py-4">
                
                {registrationResult.registration.status === 'Approved' ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Registration Approved!</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        Thank you, {registrationResult.registration.name}. Your registration for this meeting has been approved.
                      </p>
                    </div>

                    {/* Join Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl max-w-lg mx-auto text-left space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Your Access URL</span>
                      <p className="font-mono text-xs text-gray-800 break-all select-all bg-white p-2.5 rounded-xl border border-blue-200">
                        {personalJoinUrl}
                      </p>
                      {meeting.passcode && (
                        <p className="text-xs text-gray-600">
                          Passcode: <strong className="font-mono uppercase">{meeting.passcode}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(personalJoinUrl);
                          setCopied(true);
                          toast.success('Join link copied!');
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied Link' : 'Copy Join Link'}
                      </button>

                      <Button
                        onClick={() => navigate(`/meetings/${cleanRoomId}/room`)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" /> Join Meeting Now
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Pending Host Approval Screen */
                  <>
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Registration Submitted</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        Your registration has been submitted and is currently awaiting approval from the host. You will receive an access confirmation once approved.
                      </p>
                    </div>
                    <div className="pt-4">
                      <Link to="/" className="text-xs font-bold text-blue-600 hover:underline">
                        Return to Home &rarr;
                      </Link>
                    </div>
                  </>
                )}

              </div>
            ) : (
              /* Participant Registration Form */
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                
                {/* Domain restriction alert if present */}
                {meeting.registration?.allowedDomains && meeting.registration.allowedDomains.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Registration is restricted to authorized email domains: <strong>{meeting.registration.allowedDomains.join(', ')}</strong>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Vasanthan"
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)}
                      placeholder="e.g. KV"
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Confirm Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    required
                    value={confirmEmail} 
                    onChange={e => setConfirmEmail(e.target.value)}
                    placeholder="Re-enter your email address"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Organization / Company
                  </label>
                  <input 
                    type="text" 
                    value={organization} 
                    onChange={e => setOrganization(e.target.value)}
                    placeholder="e.g. University / Company name"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Custom Questions configured by host */}
                {meeting.registration?.customQuestions && meeting.registration.customQuestions.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Additional Questions</h3>
                    {meeting.registration.customQuestions.map((q, i) => (
                      <div key={i}>
                        <label className="block text-gray-700 font-bold mb-1">
                          {q.question} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        {q.options && q.options.length > 0 ? (
                          <select 
                            required={q.required}
                            value={customAnswers[q.question] || ''}
                            onChange={e => setCustomAnswers({ ...customAnswers, [q.question]: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:border-blue-500 outline-none"
                          >
                            <option value="">Select an option</option>
                            {q.options.map((opt, optIdx) => (
                              <option key={optIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            required={q.required}
                            value={customAnswers[q.question] || ''}
                            onChange={e => setCustomAnswers({ ...customAnswers, [q.question]: e.target.value })}
                            placeholder="Your answer"
                            className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-600/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Processing Registration...' : 'Register'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    By registering, you agree that the host will receive your registration information.
                  </p>
                </div>

              </form>
            )}

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-gray-200 flex items-center justify-between px-6 md:px-12 text-xs text-gray-500 bg-white">
        <span>© 2026 IntellMeet Communications, Inc.</span>
        <span>Secure Registration Portal</span>
      </footer>

    </div>
  );
}
