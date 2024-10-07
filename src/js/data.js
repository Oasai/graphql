document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token")

    if (!token) {
        window.location.replace("/")
    } else {
        fetchData(token)
    }
})

document.addEventListener("click", event => {
    if (event.target.id === "logoutButton") {
        localStorage.removeItem("token")
        window.location.replace("/")
    }
})

const endpoint = "https://01.kood.tech/api/graphql-engine/v1/graphql"

async function fetchData(token) {
    const userData = await fetchUserData(token)
    let projectData = await fetchProjects(token, userData.id)
    const projectIDs = projectData.map(object => object.group.object.id)
    const xpData = await fetchXPData(token, userData.id, projectIDs)

    const regex = /skill_/g
    const skills = xpData.filter(xp => xp.type.match(regex))
    const formattedSkills = formatSkills(skills)
    const projectXP = xpData.filter(xp => xp.type === "xp")
    projectXP.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    displayData(userData, projectXP, formattedSkills)
}

function displayData(userData, projectData, skillData) {
    displayUserData(userData)
    displayBarChart(projectData)
    displayPieChart(skillData)
}

function displayUserData(userData) {
    const date = new Date(userData.createdAt)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    userData.createdAt = `${day}/${month}/${year} ${hours}:${minutes}`

    const container = document.getElementById("user-data")
    container.innerHTML = `
        <h2>User Data</h2>
        <p>ID: ${userData.id}</p>
        <p>Username: ${userData.login}</p>
        <p>Name: ${userData.firstName} ${userData.lastName}</p>
        <p>Email: ${userData.email}</p>
        <p>Audit Ratio: ${userData.auditRatio.toFixed(3)}</p>
        <p>Joined on: ${userData.createdAt}</p>
    `
}

function displayBarChart(projectData) {
    const svgNamespace = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNamespace, "svg")
    svg.setAttribute("width", "600")
    svg.setAttribute("height", "500")
    svg.setAttribute("viewBox", "0 0 500 400")
    const barChartHeight = 300
    const barChartWidth = 450
    const barSpacing = 10
    const barWidth = (barChartWidth - (projectData.length - 1) * barSpacing) / projectData.length

    const maxXPValue = Math.max(...projectData.map(project => project.amount))

    projectData.forEach((project, index) => {
        const barHeight = (project.amount / maxXPValue) * 250
        const barX = index * (barWidth + barSpacing) + 25
        const barY = barChartHeight - barHeight - 20

        const rect = document.createElementNS(svgNamespace, "rect")
        rect.setAttribute("x", barX)
        rect.setAttribute("y", barY)
        rect.setAttribute("width", barWidth)
        rect.setAttribute("height", barHeight)
        rect.setAttribute("fill", `hsl(${index * 360 / projectData.length}, 100%, 50%)`)
        rect.setAttribute("class", "bar")

        const date = new Date(project.createdAt)
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const hours = date.getHours()
        const minutes = date.getMinutes()
        project.createdAt = `${day}/${month}/${year} ${hours}:${minutes}`

        const title = document.createElementNS(svgNamespace, "title")
        title.textContent = `Project: ${project.object.name}\nXP: ${project.amount}\nCompleted: ${project.createdAt}`
        rect.appendChild(title)

        svg.appendChild(rect)

        const text = document.createElementNS(svgNamespace, "text")
        text.setAttribute("x", barX + barWidth / 2)
        text.setAttribute("y", 290)
        text.setAttribute("text-anchor", "start")
        text.setAttribute("font-size", "12")
        text.setAttribute("transform", `rotate(45, ${barX + barWidth / 2}, 290)`)
        text.textContent = project.object.name

        svg.appendChild(text)
    })

    const container = document.getElementById("barchart-container")
    container.appendChild(svg)
}

function displayPieChart(skillData) {
    const totalWeight = Object.values(skillData).reduce((total, value) => total + value)
    const skillDataArray = Object.entries(skillData)
    const angles = skillDataArray.map(skill => (skill[1] / totalWeight) * 360)

    const svgNamespace = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNamespace, "svg")
    svg.setAttribute("width", "300")
    svg.setAttribute("height", "300")
    svg.setAttribute("viewBox", "0 0 32 32")

    let cumulativeAngle = 0
    angles.forEach((angle, index) => {
        const x = Math.cos((cumulativeAngle * Math.PI) / 180) * 16 + 16
        const y = Math.sin((cumulativeAngle * Math.PI) / 180) * 16 + 16
        cumulativeAngle += angle
        const x2 = Math.cos((cumulativeAngle * Math.PI) / 180) * 16 + 16
        const y2 = Math.sin((cumulativeAngle * Math.PI) / 180) * 16 + 16

        const largeArcFlag = angle > 180 ? 1 : 0

        const pathData = [
            `M 16,16`,
            `L ${x},${y}`,
            `A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
        ].join(" ")

        const path = document.createElementNS(svgNamespace, "path")
        path.setAttribute("d", pathData)
        path.setAttribute("fill", `hsl(${index * 360 / skillDataArray.length}, 100%, 50%)`)
        path.setAttribute("class", "pie-slice")

        const title = document.createElementNS(svgNamespace, "title")
        title.textContent = `Name: ${skillDataArray[index][0].substring(6)}\nSkill: ${skillData[skillDataArray[index][0]]}%`
        path.appendChild(title)

        svg.appendChild(path)

        const midAngle = cumulativeAngle - angle / 2
        const textX = Math.cos((midAngle * Math.PI) / 180) * 10 + 16
        const textY = Math.sin((midAngle * Math.PI) / 180) * 10 + 16

        const text = document.createElementNS(svgNamespace, "text")
        text.setAttribute("x", textX)
        text.setAttribute("y", textY)
        text.setAttribute("text-anchor", "middle")
        text.setAttribute("alignment-baseline", "middle")
        text.setAttribute("font-size", "1.5")
        text.textContent = skillDataArray[index][0].substring(6)

        svg.appendChild(text)
    })

    const container = document.getElementById("piechart-container")
    container.appendChild(svg)
}

function formatSkills(skills) {
    const formattedSkills = {}

    skills.forEach(skill => {
        const skillName = skill.type
        const skillXP = skill.amount

        if (formattedSkills[skillName]) {
            if (formattedSkills[skillName] < skillXP) {
                formattedSkills[skillName] = skillXP
            }
        } else {
            formattedSkills[skillName] = skillXP
        }
    })

    return formattedSkills
}

async function fetchUserData(token) {
    let userData

    await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            query: `
                query {
                    user {
                        id
                        login
                        firstName
                        lastName
                        email
                        auditRatio
                        createdAt
                    }
                }
            `
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.errors) {
            console.log("Error:", data.errors)
        } else {
            userData = data.data.user
        }
    })

    return userData[0]
}

async function fetchProjects(token, userId) {
    let objectData = []

    await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            query: `
                query getProjects($userId: Int!) {
                    group_user(where: { userId: { _eq: $userId }}) {
                        group {
                            object {
                                id
                                type
                            }
                        }
                    }
                }
                `,
            variables: {
                "userId": userId
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.errors) {
            console.log("Error:", data.errors)
        } else {
            objectData = data.data.group_user
            objectData = objectData.filter(object => object.group.object.type === "project")
        }
    })

    return objectData
}

async function fetchXPData(token, userId, objectIDs) {
    let xpData

    await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            query: `
                query fetchXPData($userId: Int!, $objectIDs: [Int!]) {
                    transaction(where: { userId: { _eq: $userId }, objectId: { _in: $objectIDs }}) {
                        amount
                        createdAt
                        type
                        object {
                            name
                            id
                        }
                    }
                }
            `,
            variables: {
                "userId": userId,
                "objectIDs": objectIDs
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.errors) {
            console.log("Error:", data.errors)
        } else {
            xpData = data.data.transaction
        }
    })

    return xpData
}
