function Register() {
  return (
    <div>
      <h1>Create your VitaLens account</h1>

      <form>
        <div>
          <label>Name</label>
          <input type="text" />
        </div>

        <div>
          <label>Email</label>
          <input type="email" />
        </div>

        <div>
          <label>Password</label>
          <input type="password" />
        </div>

        <button type="submit">Create Account</button>
      </form>
    </div>
  )
}

export default Register 