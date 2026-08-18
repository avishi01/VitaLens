function Login() {
  return (
    <div>
      <h1>Login</h1>

      <form>
        <div>
          <label>Email</label>
          <input type="email" />
        </div>

        <div>
          <label>Password</label>
          <input type="password" />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login 