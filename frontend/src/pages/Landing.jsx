import { Link } from "react-router-dom"

function Landing() {
  return (
    <main>
      <section>
        <h1>Understand your blood reports better.</h1>

        <p>
          VitaLens helps you organize your blood reports, understand
          important parameters, and track changes over time.
        </p>

        <div>
          <Link to="/register">Get Started</Link>
          <Link to="/login">Login</Link>
        </div>
      </section>

      <section>
        <h2>Your health data, organized.</h2>

        <p>
          Upload your reports, explore extracted parameters, understand
          your results in simple language, and prepare questions for
          your doctor.
        </p>
      </section>
    </main>
  )
}

export default Landing 