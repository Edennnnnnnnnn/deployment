document.addEventListener('DOMContentLoaded', () => {
    const username = _getURLUsername()
    fetch(`/api/user/${username}/following/`)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                console.log("Something went wrong when fetching following: " + response.status);
            }
        })
        .then(data => {
            console.log("data", data);
            let followingList = document.getElementById("following-list");
            for (let following of data) {
                followingList.innerHTML += `
                    <li class='person' onclick="window.location.href='/profile/${username}/${following.following.username}/'">
                        <img class='person-photo' src='${following.following.avatar}' alt="Profile Picture">
                        <div class='person-name'>${following.following.username}</div>
                    </li>`;
            }
        })
});

function _getURLUsername() {
    const pathSections = window.location.pathname.split('/');
    return pathSections[2];
}
