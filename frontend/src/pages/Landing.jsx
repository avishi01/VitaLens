import { Link } from "react-router-dom"

function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div>
          <div className="landing-kicker">✦ Personal health intelligence</div>
          <h1>Make sense of your health data, <span>one report at a time.</span></h1>
          <p>VitaLens brings your blood reports together, turns extracted values into understandable information, and helps you see how your results change over time.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get started <span>→</span></Link>
            <Link to="/login" className="btn btn-secondary">Log in</Link>
          </div>
          <div className="hero-note">◇ Built for understanding and doctor conversations — not diagnosis.</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orb" />
          <div className="hero-card main">
            <div className="mini-label">Latest report</div>
            <div className="mini-value">CBC Report</div>
            <div className="mini-status">● Report processed</div>
            <div className="mini-bars"><i/><i/><i/><i/><i/><i/></div>
          </div>
          <div className="hero-card small">
            <div className="mini-label">Parameter</div>
            <div className="mini-value">14.5</div>
            <div className="mini-status">Within reported range</div>
          </div>
        </div>
      </section>

      <section className="landing-section alt">
        <div className="section-inner">
          <div className="section-intro">
            <div className="eyebrow">A clearer health record</div>
            <h2>Everything you need to understand your reports.</h2>
            <p>Keep the facts from your reports organized, then use VitaLens to explore them without replacing the context of a qualified medical professional.</p>
          </div>
          <div className="feature-grid">
            <div className="card feature-card"><div className="feature-icon">01</div><h3>Organize reports</h3><p>Upload and keep your blood reports together in one personal workspace.</p></div>
            <div className="card feature-card"><div className="feature-icon">02</div><h3>Understand results</h3><p>Explore extracted parameters and AI-generated educational explanations in plain language.</p></div>
            <div className="card feature-card"><div className="feature-icon">03</div><h3>Track changes</h3><p>Compare reports and visualize shared parameters across time to prepare for conversations with your doctor.</p></div>
          </div>
        </div>
      </section>
      <section className="landing-section">
        <div className="section-intro">
          <div className="eyebrow">Designed with context</div>
          <h2>Your report stays the source of truth.</h2>
          <p>VitaLens keeps extracted report data visually separate from AI interpretation. Missing ranges remain missing rather than being guessed, and the app clearly reminds you to verify the original document.</p>
          <div className="landing-disclaimer">VitaLens is an educational and organizational tool. It does not diagnose conditions or replace professional medical advice.</div>
        </div>
      </section>
    </div>
  )
}

export default Landing
