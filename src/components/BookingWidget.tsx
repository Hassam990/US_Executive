import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, ArrowLeft, Check, ChevronDown, Clock3, Loader2, MapPin, Plane, RotateCcw, ShieldCheck, Sparkles, Users, X } from "lucide-react";

type BookingStatus = "idle" | "loading" | "success" | "error";
type LocationField = "pickup" | "dropoff";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type BookingData = {
  name: string;
  email: string;
  phone: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  returnDate: string;
  returnTime: string;
  passengers: string;
  vehicleClass: string;
};

const today = new Date().toISOString().slice(0, 10);
const vehicleOptions = [
  { value: "Saloon", label: "Executive saloon", detail: "1–3 guests", price: 48 },
  { value: "Estate", label: "Executive estate", detail: "1–4 guests", price: 58 },
  { value: "Executive", label: "First-class saloon", detail: "1–3 guests", price: 78 },
  { value: "MPV", label: "Executive MPV", detail: "1–7 guests", price: 96 },
];

function AddressField({
  label,
  value,
  placeholder,
  field,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  field: LocationField;
  onChange: (field: LocationField, value: string) => void;
  onSelect: (field: LocationField, suggestion: Suggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onChange(field, nextValue);
    if (timer.current) clearTimeout(timer.current);
    if (nextValue.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=5&q=${encodeURIComponent(nextValue)}`);
        const data = (await response.json()) as Suggestion[];
        setSuggestions(data);
        setIsOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="field-shell relative">
      <label htmlFor={field}>{label}</label>
      <div className="field-input-wrap">
        <MapPin size={17} aria-hidden="true" />
        <input
          id={field}
          name={field}
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          required
        />
        {loading && <Loader2 className="field-loader" size={16} aria-label="Loading suggestions" />}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="suggestions" role="listbox" aria-label={`${label} suggestions`}>
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={`${suggestion.lat}-${suggestion.lon}`}
              onMouseDown={() => {
                onSelect(field, suggestion);
                setIsOpen(false);
              }}
            >
              <MapPin size={15} />
              <span>{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BookingWidget() {
  const [step, setStep] = useState(1);
  const [isReturn, setIsReturn] = useState(false);
  const [status, setStatus] = useState<BookingStatus>("idle");
  const [formData, setFormData] = useState<BookingData>({
    name: "",
    email: "",
    phone: "",
    pickup: "",
    dropoff: "",
    date: "",
    time: "",
    returnDate: "",
    returnTime: "",
    passengers: "1",
    vehicleClass: "Saloon",
  });

  const selectedVehicle = useMemo(() => vehicleOptions.find((vehicle) => vehicle.value === formData.vehicleClass) ?? vehicleOptions[0], [formData.vehicleClass]);
  const estimate = selectedVehicle.price + (Number(formData.passengers) > 3 ? 16 : 0) + (isReturn ? selectedVehicle.price * 0.82 : 0);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updateLocation = (field: LocationField, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const selectLocation = (field: LocationField, suggestion: Suggestion) => {
    setFormData((current) => ({ ...current, [field]: suggestion.display_name }));
  };

  const stepOneReady = formData.pickup.trim().length > 2 && formData.dropoff.trim().length > 2;
  const stepTwoReady = Boolean(formData.date && formData.time && (!isReturn || (formData.returnDate && formData.returnTime)));

  const nextStep = () => {
    if (step === 1 && stepOneReady) setStep(2);
    if (step === 2 && stepTwoReady) setStep(3);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReturn, ...formData }),
      });
      if (!response.ok) throw new Error("Booking request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="booking-card booking-success">
        <div className="success-mark"><Check size={26} /></div>
        <p className="eyebrow">Request received</p>
        <h2>Your journey is in motion.</h2>
        <p>Our dispatch team will confirm availability and your final fare by email shortly.</p>
        <div className="success-route"><span>{formData.pickup}</span><ArrowRight size={16} /><span>{formData.dropoff}</span></div>
        <button className="text-button" type="button" onClick={() => { setStatus("idle"); setStep(1); }}>Make another booking <ArrowRight size={15} /></button>
      </div>
    );
  }

  return (
    <div className="booking-card">
      <div className="booking-card-top">
        <div>
          <p className="eyebrow">Private hire, refined</p>
          <h2>Reserve your car</h2>
        </div>
        <div className="secure-note"><ShieldCheck size={16} /> Secure request</div>
      </div>
      <div className="stepper" aria-label="Booking progress">
        {["Route", "Journey", "Details"].map((label, index) => {
          const number = index + 1;
          return <div className={`step ${step >= number ? "active" : ""}`} key={label}><span>{number}</span><small>{label}</small></div>;
        })}
      </div>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="wizard-panel">
            <div className="trip-toggle" role="group" aria-label="Journey type">
              <button type="button" className={!isReturn ? "selected" : ""} onClick={() => setIsReturn(false)}>One way</button>
              <button type="button" className={isReturn ? "selected" : ""} onClick={() => setIsReturn(true)}><RotateCcw size={14} /> Return</button>
            </div>
            <div className="location-stack">
              <AddressField label="Pick-up location" value={formData.pickup} field="pickup" placeholder="Airport, hotel, postcode..." onChange={updateLocation} onSelect={selectLocation} />
              <div className="route-line" aria-hidden="true"><span /><span /><span /></div>
              <AddressField label="Destination" value={formData.dropoff} field="dropoff" placeholder="Where should we take you?" onChange={updateLocation} onSelect={selectLocation} />
            </div>
            <div className="booking-tip"><Plane size={17} /><span>Airport transfers include flight monitoring and complimentary wait time.</span></div>
            <button className="primary-button" type="submit" disabled={!stepOneReady}>Choose your car <ArrowRight size={17} /></button>
          </div>
        )}
        {step === 2 && (
          <div className="wizard-panel">
            <div className="panel-heading"><div><p className="eyebrow">Step 02</p><h3>Set your timing</h3></div><Clock3 size={22} /></div>
            <div className="two-column-fields">
              <div className="field-shell"><label htmlFor="date">Pick-up date</label><input id="date" name="date" type="date" min={today} value={formData.date} onChange={updateField} required /></div>
              <div className="field-shell"><label htmlFor="time">Pick-up time</label><input id="time" name="time" type="time" value={formData.time} onChange={updateField} required /></div>
            </div>
            {isReturn && <div className="return-fields"><div className="return-label"><RotateCcw size={15} /> Return journey</div><div className="two-column-fields"><div className="field-shell"><label htmlFor="returnDate">Return date</label><input id="returnDate" name="returnDate" type="date" min={formData.date || today} value={formData.returnDate} onChange={updateField} required /></div><div className="field-shell"><label htmlFor="returnTime">Return time</label><input id="returnTime" name="returnTime" type="time" value={formData.returnTime} onChange={updateField} required /></div></div></div>}
            <div className="vehicle-grid">{vehicleOptions.map((vehicle) => <button type="button" key={vehicle.value} className={`vehicle-option ${formData.vehicleClass === vehicle.value ? "selected" : ""}`} onClick={() => setFormData((current) => ({ ...current, vehicleClass: vehicle.value }))}><div><strong>{vehicle.label}</strong><span>{vehicle.detail}</span></div><b>from £{vehicle.price}</b></button>)}</div>
            <div className="wizard-actions"><button className="back-button" type="button" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button><button className="primary-button" type="submit" disabled={!stepTwoReady}>Review request <ArrowRight size={17} /></button></div>
          </div>
        )}
        {step === 3 && (
          <div className="wizard-panel">
            <div className="panel-heading"><div><p className="eyebrow">Step 03</p><h3>Where should we send confirmation?</h3></div><Sparkles size={22} /></div>
            <div className="two-column-fields"><div className="field-shell"><label htmlFor="name">Full name</label><input id="name" name="name" value={formData.name} onChange={updateField} placeholder="Alex Morgan" required /></div><div className="field-shell"><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" type="tel" value={formData.phone} onChange={updateField} placeholder="+44 7..." required /></div></div>
            <div className="field-shell"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={formData.email} onChange={updateField} placeholder="you@company.com" required /></div>
            <div className="review-card"><div><span>Route</span><strong>{formData.pickup || "Pick-up"}</strong><ArrowRight size={15} /><strong>{formData.dropoff || "Destination"}</strong></div><div><span>Journey</span><strong>{formData.date || "Date"} · {formData.time || "Time"}</strong></div><div><span>Vehicle</span><strong>{selectedVehicle.label} · {formData.passengers} passenger{formData.passengers === "1" ? "" : "s"}</strong></div><div className="estimate"><span>Indicative fare</span><strong>£{estimate}</strong></div></div>
            <div className="wizard-actions"><button className="back-button" type="button" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button><button className="primary-button" type="submit" disabled={status === "loading"}>{status === "loading" ? <><Loader2 className="spin" size={17} /> Sending...</> : <>Request booking <ArrowRight size={17} /></>}</button></div>
            {status === "error" && <p className="form-error"><X size={15} /> We couldn't send that request. Please try again or call 07412 671467.</p>}
          </div>
        )}
      </form>
      {step === 2 && <div className="passenger-row"><Users size={16} /><label htmlFor="passengers">Passengers</label><select id="passengers" name="passengers" value={formData.passengers} onChange={updateField}>{[1, 2, 3, 4, 5, 6, 7].map((number) => <option key={number} value={number}>{number}</option>)}</select><ChevronDown size={14} /></div>}
      <p className="booking-footnote">No payment is taken now · final quote confirmed by dispatch</p>
    </div>
  );
}
