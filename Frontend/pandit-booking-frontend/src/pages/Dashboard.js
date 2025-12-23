import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  CalendarDays,
  Book,
  LogOut,
  ListChecks,
  MessageCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkle,
  Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Dashboard.css";
import {
  createReview,
  getBookings,
  getVerifiedPandits,
  createBooking,
  getPoojas,
} from "../api/api";
import ChatWindow from "./ChatWindow";
import { useNavigate } from "react-router-dom";

const featureCardsData = [
  {
    title: "Live Chat Support",
    description:
      "Ask spiritual or booking questions to our team – instant help, 7am to 10pm.",
    icon: MessageCircle,
  },
  {
    title: "Preferred Pandit Booking",
    description:
      "Save favorite Pandits, see their next available slots, and book with just one tap.",
    icon: Users,
  },
  {
    title: "Festive Offers",
    description:
      "Special discounts and promo codes for all major festivals and family events.",
    icon: Sparkle,
  },
];

const sidebarLinks = [
  { label: "Dashboard", icon: Home, goto: "#top" },
  { label: "Book Puja", icon: Book, goto: "#book-puja" },
  { label: "My Bookings", icon: CalendarDays, goto: "#booking" },
  { label: "Reviews", icon: MessageCircle, goto: "#review" },
  { label: "Settings", icon: Settings, goto: "#settings" },
  { label: "Logout", icon: LogOut, goto: "/home", logout: true },
];

const sliderImages = [
  "/images/i2.jpeg",
  "/images/kalash.jpeg",
  "/images/havan.jpeg",
  "/images/i3.jpeg",
  "/images/i1.jpeg",
];

function StarRating({ rating, onChange }) {
  return (
    <div className="star-rating" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          role="button"
          tabIndex="0"
          className={`star ${i <= rating ? "active" : ""}`}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && onChange(i)
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pandits, setPandits] = useState([]);
  const [poojas, setPoojas] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedPandits, setExpandedPandits] = useState({});
  const [searchPandits, setSearchPandits] = useState("");
  const [searchBookings, setSearchBookings] = useState("");
  const [review, setReview] = useState({ name: "", rating: 0, comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatPanditId, setChatPanditId] = useState(null);
  const [chatPanditName, setChatPanditName] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Booking state
  const [selectedPanditId, setSelectedPanditId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [bookingDetails, setBookingDetails] = useState({
    puja_date: "",
    puja_time: "",
    location: "",
    SamanList: "",
  });
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const navigate = useNavigate();
  const panditListRef = useRef(null);
  const bookingListRef = useRef(null);

  // Fetch bookings for the user
  const fetchBookings = async (userId) => {
    try {
      const res = await getBookings({ userid: userId });
      setBookings(res.data || []);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  // Fetch verified pandits
  const fetchPandits = async () => {
    try {
      const res = await getVerifiedPandits();
      setPandits(res.data || []);
    } catch (error) {
      console.error("Failed to fetch pandits:", error);
    }
  };

  // Fetch all pujas
  const fetchPoojas = async () => {
    try {
      const res = await getPoojas();
      setPoojas(res.data || []);
    } catch (error) {
      console.error("Failed to fetch pujas:", error);
    }
  };

  // Initialization on mount
  useEffect(() => {
    AOS.init({ duration: 750, once: true });

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      navigate("/login");
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setReview((r) => ({ ...r, name: parsedUser.name }));
      fetchBookings(parsedUser._id);
      fetchPandits();
      fetchPoojas();
    } catch (e) {
      console.error("Failed to parse user data:", e);
      localStorage.clear();
      navigate("/login");
    }
  }, [navigate]);

  // Carousel auto-slide
  useEffect(() => {
    const interval = setInterval(
      () =>
        setCarouselIndex((i) =>
          sliderImages.length ? (i + 1) % sliderImages.length : 0
        ),
      4500
    );
    return () => clearInterval(interval);
  }, []);

  // Current date-time every second
  useEffect(() => {
    const itv = setInterval(
      () =>
        setCurrentDateTime(
          new Date().toLocaleString("en-IN", {
            dateStyle: "full",
            timeStyle: "medium",
            timeZone: "Asia/Kolkata",
          })
        ),
      1000
    );
    return () => clearInterval(itv);
  }, []);

  function toggleExpand(id) {
    setExpandedPandits((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const getStatusClass = (status) =>
    ({
      accepted: "status accepted",
      confirmed: "status accepted",
      rejected: "status rejected",
      pending: "status pending",
      completed: "status completed",
    }[(status || "").toLowerCase()] || "status");

  const filteredPandits = pandits.filter(
    (p) =>
      (p.name?.toLowerCase() || "").includes(searchPandits.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(searchPandits.toLowerCase()) ||
      (p.specialties || []).some((s) =>
        s.toLowerCase().includes(searchPandits.toLowerCase())
      )
  );

  const filteredBookings = bookings.filter((b) => {
    const q = searchBookings.toLowerCase();
    return (
      (b.panditid?.name || "").toLowerCase().includes(q) ||
      (b.serviceid?.name || "").toLowerCase().includes(q) ||
      new Date(b.puja_date).toLocaleDateString().includes(q) ||
      (b.location || "").toLowerCase().includes(q)
    );
  });

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!review.name || !review.comment || !review.rating) {
      setReviewMessage("Please complete all fields and provide star rating.");
      return;
    }
    setReviewLoading(true);
    try {
      await createReview(review);
      setReviewMessage("Thank you for your review!");
      setReview((r) => ({ name: r.name, rating: 0, comment: "" }));
    } catch (error) {
      console.error("Review submission error:", error);
      setReviewMessage("Failed to submit review.");
    } finally {
      setReviewLoading(false);
      setTimeout(() => setReviewMessage(""), 2500);
    }
  }

  function handleNavClick(item) {
    if (item.logout) {
      localStorage.clear();
      navigate(item.goto);
      setIsSidebarOpenMobile(false);
      setActiveSection("Dashboard");
      return;
    }

    if (String(item.goto).startsWith("#")) {
      const section = document.querySelector(item.goto);
      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      navigate(item.goto);
    }

    if (item.label) {
      setActiveSection(item.label);
    }

    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setIsSidebarOpenMobile(false);
    }
  }

  function scrollList(ref, direction = "left") {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }

  function handlePanditSelect(e) {
    const panditId = e.target.value;
    setSelectedPanditId(panditId);
    setSelectedServiceId("");
    setBookingStatus(null);
  }

  function handleServiceSelect(e) {
    setSelectedServiceId(e.target.value);
    setBookingStatus(null);
  }

  function handleBookingDetailsChange(e) {
    const { name, value } = e.target;
    setBookingDetails((b) => ({ ...b, [name]: value }));
    setBookingStatus(null);
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingStatus(null);

    if (!selectedPanditId) {
      setBookingStatus({ error: "Please select a Pandit." });
      return;
    }
    if (!selectedServiceId) {
      setBookingStatus({ error: "Please select the Puja/service." });
      return;
    }
    if (
      !bookingDetails.puja_date ||
      !bookingDetails.puja_time ||
      !bookingDetails.location.trim()
    ) {
      setBookingStatus({ error: "Please fill all booking details." });
      return;
    }
    if (!user?._id) {
      setBookingStatus({ error: "User not found. Please login again." });
      return;
    }

    setBookingLoading(true);

    try {
      const payload = {
        userid: user._id,
        panditid: selectedPanditId,
        serviceid: selectedServiceId,
        puja_date: bookingDetails.puja_date,
        puja_time: bookingDetails.puja_time,
        location: bookingDetails.location.trim(),
        SamanList: bookingDetails.SamanList?.trim() || "",
        userName: user.name,
      };

      await createBooking(payload);

      setBookingStatus({
        success: "Puja booked successfully! Awaiting Pandit confirmation.",
      });
      fetchBookings(user._id);

      setSelectedPanditId("");
      setSelectedServiceId("");
      setBookingDetails({
        puja_date: "",
        puja_time: "",
        location: "",
        SamanList: "",
      });
    } catch (error) {
      console.error("Booking error:", error);
      setBookingStatus({
        error:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to book puja. Please try again later.",
      });
    } finally {
      setBookingLoading(false);
      setTimeout(() => setBookingStatus(null), 3500);
    }
  }

  const totalPujasBooked = bookings.length;
  const upcomingPuja = bookings.find(
    (b) =>
      new Date(b.puja_date) >= new Date() &&
      (b.status || "").toLowerCase() !== "completed"
  );
  const pendingBookingsCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "pending"
  ).length;
  const acceptedBookingsCount = bookings.filter((b) =>
    ["accepted", "confirmed"].includes((b.status || "").toLowerCase())
  ).length;
  const rejectedBookingsCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "rejected"
  ).length;
  const availablePoints = user?.points || 450;

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="dashboard-app-bg orange-theme" id="top">
      {/* Sidebar */}
      <aside
        className={`sidebar-root${collapsed ? " collapsed" : ""}${
          isSidebarOpenMobile ? " open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <img
            src="/images/subh.png"
            alt="Shubhkarya Logo"
            className="sidebar-logo"
          />
          {!collapsed && (
            <span className="sidebar-brand-name" tabIndex={0}>
              Shubhkarya
            </span>
          )}
        </div>

        <nav className="sidebar-links" aria-label="Main navigation">
          {sidebarLinks.map(({ label, icon: Icon, goto, logout }) => (
            <button
              key={label}
              className={`sidebar-link${
                activeSection === label ? " active" : ""
              }`}
              tabIndex={0}
              onClick={() => handleNavClick({ goto, logout, label })}
              aria-label={label}
            >
              <Icon size={20} className="sidebar-link-icon" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {!collapsed && user && (
          <div className="sidebar-footer">
            <div className="sidebar-user-mini">
              <div className="sidebar-user-avatar">{userInitial}</div>
              <div>
                <p className="sidebar-user-name">{user.name}</p>
                <p className="sidebar-user-points">
                  {availablePoints} pts available
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ListChecks size={18} />
        </button>
      </aside>

      {/* Header */}
      <header className="header-root">
        <div className="user-block">
          <button
            type="button"
            className="mobile-sidebar-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setIsSidebarOpenMobile((open) => !open)}
          >
            {isSidebarOpenMobile ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
          <div className="user-avatar">{userInitial}</div>
          <div>
            <div className="header-user-welcome">
              Welcome, {user?.name || "Guest"}!
            </div>
            <div className="header-user-email">
              {user?.email || "user@example.com"}
            </div>
          </div>
        </div>
        <div className="header-datetime">{currentDateTime}</div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Dashboard Overview */}
        <section className="dashboard-overview" data-aos="fade-up">
          <h2 className="section-heading">Dashboard Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <CalendarDays size={28} />
              </div>
              <div className="stat-content">
                <h3>Total Pujas Booked</h3>
                <p className="stat-number">{totalPujasBooked}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Book size={28} />
              </div>
              <div className="stat-content">
                <h3>Upcoming Puja</h3>
                <p className="stat-text">
                  {upcomingPuja ? upcomingPuja.serviceid?.name : "No upcoming pujas"}
                </p>
                {upcomingPuja && (
                  <p className="stat-subtext">
                    {new Date(upcomingPuja.puja_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Sparkle size={28} />
              </div>
              <div className="stat-content">
                <h3>Available Points</h3>
                <p className="stat-number">{availablePoints}</p>
              </div>
            </div>
          </div>

          <div className="insights-row" aria-label="Quick booking insights">
            <div className="insight-chip pending">
              <span className="insight-label">Pending</span>
              <span className="insight-value">{pendingBookingsCount}</span>
            </div>
            <div className="insight-chip accepted">
              <span className="insight-label">Confirmed</span>
              <span className="insight-value">{acceptedBookingsCount}</span>
            </div>
            <div className="insight-chip rejected">
              <span className="insight-label">Rejected</span>
              <span className="insight-value">{rejectedBookingsCount}</span>
            </div>
          </div>
          <button
            className="main-cta-btn large-book-btn"
            onClick={() => {
              const bookPujaSection = document.querySelector("#book-puja");
              if (bookPujaSection) {
                bookPujaSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }}
          >
            <Book size={18} style={{ marginRight: 6 }} />
            Book Puja Now
          </button>
        </section>

        {/* Hero & Slider */}
        <section className="hero-section">
          <div className="hero-content" data-aos="fade-right">
            <h1 className="hero-title">
              Experience{" "}
              <span className="hero-highlight">Auspicious Rituals</span> with
              Shubhkarya
            </h1>
            <p className="hero-subtitle">
              Book trusted Pandits for your pujas, havans, and ceremonies with
              elegance and ease. Now enhanced with same-day bookings and instant
              chat support.
            </p>
            <div className="hero-actions">
              <button
                className="main-cta-btn"
                onClick={() => {
                  const bookPujaSection = document.querySelector("#book-puja");
                  if (bookPujaSection) {
                    bookPujaSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                Book Puja Now
              </button>
              <button
                className="main-alt-btn"
                onClick={() => {
                  const panditSection = document.querySelector("#pandit");
                  if (panditSection) {
                    panditSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Browse Pandits
              </button>
            </div>
          </div>
          <div className="slider-wrapper" data-aos="fade-left">
            <div className="carousel-frame">
              <AnimatePresence initial={false} mode="wait">
                <motion.img
                  key={carouselIndex}
                  src={sliderImages[carouselIndex]}
                  alt={`Slide ${carouselIndex + 1}`}
                  loading="lazy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>
              <div className="carousel-dots">
                {sliderImages.map((_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot${
                      carouselIndex === i ? " active" : ""
                    }`}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="dashboard-features" data-aos="fade-up">
          {featureCardsData.map((feature, index) => (
            <div className="feature-card" key={index}>
              {feature.icon && (
                <feature.icon size={28} className="feature-icon" />
              )}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        {/* Book Puja Section */}
        <section
          id="book-puja"
          className="book-puja-section"
          aria-label="Book Puja"
          tabIndex={-1}
          data-aos="fade-up"
        >
          <h2 className="section-heading">Book Your Puja</h2>
          <div className="booking-form-container">
            <form
              onSubmit={handleBookingSubmit}
              className="booking-form"
              noValidate
            >
              <div className="form-group">
                <label htmlFor="selectPandit">Select Pandit</label>
                <select
                  id="selectPandit"
                  value={selectedPanditId}
                  onChange={handlePanditSelect}
                  required
                >
                  <option value="">-- Choose a Pandit --</option>
                  {filteredPandits.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="selectPuja">Select Puja / Service</label>
                <select
                  id="selectPuja"
                  value={selectedServiceId}
                  onChange={handleServiceSelect}
                  required
                  disabled={poojas.length === 0}
                >
                  <option value="">
                    {poojas.length > 0
                      ? "-- Choose a Puja / Service --"
                      : "Loading pujas..."}
                  </option>
                  {poojas.map((pooja) => (
                    <option
                      key={pooja._id || pooja.id}
                      value={pooja._id || pooja.id}
                    >
                      {pooja.name} - ₹{pooja.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="puja_date">Date</label>
                  <input
                    type="date"
                    id="puja_date"
                    name="puja_date"
                    value={bookingDetails.puja_date}
                    onChange={handleBookingDetailsChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="puja_time">Time</label>
                  <input
                    type="time"
                    id="puja_time"
                    name="puja_time"
                    value={bookingDetails.puja_time}
                    onChange={handleBookingDetailsChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location / Address</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={bookingDetails.location}
                  onChange={handleBookingDetailsChange}
                  placeholder="Enter your location or address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="SamanList">
                  Special instructions / samagri details (optional)
                </label>
                <textarea
                  id="SamanList"
                  name="SamanList"
                  className="form-textarea"
                  value={bookingDetails.SamanList}
                  onChange={handleBookingDetailsChange}
                  placeholder="Mention any special requests, preferred samagri list, or additional details for the pandit."
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={bookingLoading}
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>

              {bookingStatus?.error && (
                <p className="error-message" role="alert">
                  {bookingStatus.error}
                </p>
              )}
              {bookingStatus?.success && (
                <p className="success-message" role="alert">
                  {bookingStatus.success}
                </p>
              )}
            </form>
          </div>
        </section>

        {/* Verified Pandits */}
        <section
          id="pandit"
          className="pandit-section"
          tabIndex={-1}
          aria-label="Verified Pandits"
          data-aos="fade-up"
        >
          <div className="section-header">
            <h2 className="section-heading">Verified Pandits</h2>
            <div className="carousel-controls">
              <button
                aria-label="Scroll pandits left"
                onClick={() => scrollList(panditListRef, "left")}
                className="carousel-arrow-btn"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Scroll pandits right"
                onClick={() => scrollList(panditListRef, "right")}
                className="carousel-arrow-btn"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, city, or specialty..."
            value={searchPandits}
            onChange={(e) => setSearchPandits(e.target.value)}
          />
          <div className="pandit-list" ref={panditListRef}>
            {filteredPandits.length === 0 ? (
              <p className="empty-msg">No Pandits found matching your search.</p>
            ) : (
              filteredPandits.map((pandit) => (
                <motion.div
                  key={pandit._id}
                  className="pandit-card"
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => toggleExpand(pandit._id)}
                >
                  <div
                    className="pandit-avatar"
                    style={{
                      backgroundImage: `url(${
                        pandit.profile_photo_url || "/images/i1.jpeg"
                      })`,
                    }}
                  >
                    <span className="pandit-avatar-initial">
                      {pandit.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="pandit-info">
                    <h4 className="pandit-name">{pandit.name}</h4>
                    <p className="pandit-city">{pandit.city}</p>
                    {expandedPandits[pandit._id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pandit-details"
                      >
                        <div className="pandit-badges">
                          {pandit.experienceYears && (
                            <span className="badge">
                              {pandit.experienceYears} yrs exp
                            </span>
                          )}
                          {pandit.languages?.length > 0 && (
                            <span className="badge">
                              {pandit.languages.join(", ")}
                            </span>
                          )}
                        </div>
                        {pandit.specialties?.length > 0 && (
                          <p className="pandit-specialties">
                            <strong>Specialties:</strong>{" "}
                            {pandit.specialties.join(", ")}
                          </p>
                        )}
                      </motion.div>
                    )}
                    <button
                      className="chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatPanditId(pandit._id);
                        setChatPanditName(pandit.name);
                      }}
                    >
                      <MessageCircle size={14} />
                      Chat with Pandit
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Chat Window */}
        <AnimatePresence>
          {chatPanditId && (
            <ChatWindow
              userId={user?._id}
              panditId={chatPanditId}
              chatName={chatPanditName}
              onClose={() => setChatPanditId(null)}
            />
          )}
        </AnimatePresence>

        {/* My Bookings */}
        <section
          id="booking"
          className="bookings-section"
          tabIndex={-1}
          aria-label="My Bookings"
          data-aos="fade-up"
        >
          <div className="section-header">
            <h2 className="section-heading">My Bookings</h2>
            <div className="carousel-controls">
              <button
                aria-label="Scroll bookings left"
                onClick={() => scrollList(bookingListRef, "left")}
                className="carousel-arrow-btn"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Scroll bookings right"
                onClick={() => scrollList(bookingListRef, "right")}
                className="carousel-arrow-btn"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search bookings..."
            value={searchBookings}
            onChange={(e) => setSearchBookings(e.target.value)}
          />
          <div className="booking-list" ref={bookingListRef}>
            {filteredBookings.length === 0 ? (
              <p className="empty-msg">
                No bookings found.{" "}
                <a
                  href="#book-puja"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#book-puja");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Book your first puja now!
                </a>
              </p>
            ) : (
              filteredBookings.map((b) => (
                <motion.div
                  key={b._id}
                  className="booking-card"
                  whileHover={{ scale: 1.01, y: -4 }}
                >
                  <div className="booking-header">
                    <span className="booking-icon">📅</span>
                    <div>
                      <h4 className="booking-title">{b.serviceid?.name}</h4>
                      <p className="booking-date">
                        {new Date(b.puja_date).toLocaleDateString()} at{" "}
                        {b.puja_time}
                      </p>
                    </div>
                  </div>
                  <div className="booking-details">
                    <p className="booking-pandit">
                      <strong>Pandit:</strong> {b.panditid?.name ?? "N/A"}
                    </p>
                    <p className="booking-location">
                      <strong>Location:</strong> 📍 {b.location}
                    </p>
                    <span className={getStatusClass(b.status)}>
                      {b.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Settings */}
        <section
          id="settings"
          className="settings-section"
          tabIndex={-1}
          aria-label="Settings"
          data-aos="fade-up"
        >
          <h2 className="section-heading">Settings</h2>
          <div className="settings-card">
            <p className="settings-description">
              Manage your profile, notification preferences, and language here.
              (You can wire this section to real API endpoints later.)
            </p>
            <div className="settings-grid">
              <button className="settings-chip">Profile details</button>
              <button className="settings-chip">Notification preferences</button>
              <button className="settings-chip">Language &amp; region</button>
              <button className="settings-chip">Privacy</button>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section
          id="review"
          className="review-section"
          tabIndex={-1}
          aria-label="Submit Review"
          data-aos="fade-up"
        >
          <h2 className="section-heading">Submit a Review</h2>
          {reviewMessage && (
            <p
              className={
                reviewMessage.includes("Thank you")
                  ? "success-message"
                  : "error-message"
              }
              role="alert"
            >
              {reviewMessage}
            </p>
          )}
          <form onSubmit={handleReviewSubmit} className="review-form">
            <div className="form-group">
              <label htmlFor="reviewer-name">Your Name</label>
              <input
                id="reviewer-name"
                type="text"
                value={user?.name || ""}
                disabled
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Your Rating</label>
              <StarRating
                rating={review.rating}
                onChange={(v) =>
                  setReview((prev) => ({ ...prev, rating: v }))
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="review-comment">Your Review</label>
              <textarea
                id="review-comment"
                placeholder="Share your experience with Shubhkarya..."
                value={review.comment}
                onChange={(e) =>
                  setReview((prev) => ({ ...prev, comment: e.target.value }))
                }
                className="form-textarea"
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={reviewLoading}
            >
              {reviewLoading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </section>

        {/* Chatbot Button */}
        <button
          aria-label="Toggle Chatbot"
          className="chatbot-toggle"
          onClick={() => setShowChatbot((s) => !s)}
        >
          {showChatbot ? (
            <span style={{ fontSize: 28, color: "white" }}>×</span>
          ) : (
            <img
              src="/images/subh.png"
              alt="Open Chatbot"
              style={{ borderRadius: "50%", width: 34, height: 34 }}
            />
          )}
        </button>
        {showChatbot && (
          <div
            className="chatbot-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Chatbot window"
          >
            <iframe
              title="Chatbot"
              src="https://www.chatbase.co/chatbot-iframe/usovl2iS71gPfrO5xmRyP"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: 15,
              }}
              allow="clipboard-write"
            />
          </div>
        )}
      </main>
    </div>
  );
}
