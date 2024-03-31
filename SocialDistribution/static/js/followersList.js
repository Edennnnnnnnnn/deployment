document.addEventListener('DOMContentLoaded', () => {
    const username = _getURLUsername()
    fetch(`/api/user/${username}/followers/`)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                console.log("Something went wrong when fetching followers: " + response.status);
            }
        })
        .then(data => {
            console.log("data", data);
            let followersList = document.getElementById("followers-list");
            for (let follower of data) {
                followersList.innerHTML += `
                    <li class='person' onclick="window.location.href='/profile/${username}/${follower.follower.username}/'">
                        <img class='person-photo' src='${follower.follower.avatar}' alt="Profile Picture">
                        <div class='person-name'>${follower.follower.username}</div>
                    </li>`;
            }
        })
});

function _getURLUsername() {
    const pathSections = window.location.pathname.split('/');
    return pathSections[2];
}
