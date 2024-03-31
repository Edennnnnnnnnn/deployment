document.addEventListener('DOMContentLoaded', () => {
    const username = _getURLUsername();
    fetch(`/api/user/${username}/friends/`)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                alert("Something went wrong when fetching followings: " + response.status);
            }
        })
        .then(data => {
            let followingList = document.getElementById("friends-list");
            data.forEach(friend => {
                followingList.innerHTML += "<li class='person'><img class='person-photo' src='person1.jpg' alt='Profile Picture'><p class='person-name'>" + friend.username + "</p></li>";
            });
        });
});

function _getURLUsername() {
    const pathSections = window.location.pathname.split('/');
    return pathSections[2];
}
