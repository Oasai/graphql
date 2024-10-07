document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault()

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    authenticate(username, password)
})

function authenticate(username, password) {
    const endpointAuth = "https://01.kood.tech/api/auth/signin"
    const credentials = btoa(`${username}:${password}`)
    let token = ""

    fetch (endpointAuth, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${credentials}`
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log("Invalid credentials")
            document.getElementById("error").innerText = "Invalid credentials"
        } else {
            token = data
            localStorage.setItem("token", token)
            window.location.replace("/data")
        }
    })
}
