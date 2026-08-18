function UploadReport() {
  return (
    <div>
      <h1>Upload Blood Report</h1>

      <form>
        <input type="file" accept=".pdf" />
        <button type="submit">Upload Report</button>
      </form>
    </div>
  )
}

export default UploadReport 