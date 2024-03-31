document.addEventListener('DOMContentLoaded', async function() {
    let selfUsername;
    const response = await fetch('/api/get-self-username/');
    if (response.ok) {
        const data = await response.json();
        selfUsername = data.username;
    }
    const remoteNodename = _getURLRemoteNodename();
    const remoteUsername = _getURLRemoteUsername();

    const followButton = document.getElementById('follow-btn');
    const unfollowButton = document.getElementById('unfollow-btn');
    const relationInstruction = document.getElementById('relation');

    // todo
    followButton.style.display = "none";
    unfollowButton.style.display = "none";
    fetch(`/remotecheckfollower/${remoteNodename}/${selfUsername}/${remoteUsername}/`)
        .then(relationResponse => {
            if (!relationResponse.ok) {
                alert("Error in checking relationship.")
            }
            return relationResponse.json();
        })
        .then(relations => {
            if (relations["is_follower"]) {
                relationInstruction.textContent = `- You Are Following Remote User ${remoteUsername} from ${remoteNodename} -`;
                followButton.style.display = "none";
                unfollowButton.style.display = "inline";
            }
            else {
                relationInstruction.textContent = `- Hi, I'm ${remoteUsername} from ${remoteNodename}, Nice To Meet U -`;
                followButton.style.display = "inline";
                unfollowButton.style.display = "none";
            }
        });

    if (followButton) {
        followButton.addEventListener('click', function() {
            sendFollowRequest(remoteNodename, selfUsername, remoteUsername);
        });
    }

    if (unfollowButton) {
        unfollowButton.addEventListener('click', function() {
            unfollowRequesting(remoteNodename, selfUsername, remoteUsername);
        });
    }


});

function _getURLRemoteUsername() {
    const pathSections = window.location.pathname.split('/').filter(Boolean);
    return pathSections[pathSections.length - 1];
}

function _getURLRemoteNodename() {
    const pathSections = window.location.pathname.split('/').filter(Boolean);
    return pathSections[pathSections.length - 2];
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function sendFollowRequest(remoteNodename, requesterUsername, projUsername) {
    const url = `/followrequesting/${encodeURIComponent(remoteNodename)}/${encodeURIComponent(requesterUsername)}/${encodeURIComponent(projUsername)}/`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            alert("Follow Request Sent!");
        })
        .catch(error => {
            console.error('Error during fetch:', error.message);
            alert("Error during the requesting.");
        });
}

function unfollowRequesting(remoteNodename, userUsername, projUsername) {
    const url = `/unfllowrequesting/${encodeURIComponent(remoteNodename)}/${encodeURIComponent(userUsername)}/${encodeURIComponent(projUsername)}/`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            alert("You are no longer following.");
            return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}
