'use strict';

import {formatDate} from "./common.js";

function editUserName(){
    let el = document.getElementById("username");

    el.style.display = 'none';

    let input = document.getElementById("edit-username");
    input.style.display = 'inline';
    input.focus();
    input.value = el.innerText;

}


function handleUserNameBlur() {
    let el = document.getElementById("edit-username");
    let formData = new FormData();
    formData.append("username", el.value)

    fetch(`update-username/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken') // Get CSRF token
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let errEl = document.getElementById("update-username-error")
            if (errEl) {
                errEl.remove()
            }
            if (data.error !== '') {
                let parentElement = document.getElementById("profile-info");
                let spanElement = document.createElement("span");
                spanElement.textContent = data.error;
                spanElement.style.color = 'red';
                spanElement.setAttribute("id", "update-username-error")
                parentElement.insertBefore(spanElement, el.nextSibling)
                el.focus();
            }
            else {
                el.style.display = 'none'
                let username = document.getElementById("username");
                username.innerText = el.value
                username.style.display = 'inline';
                let parts = window.location.pathname.split('/')
                parts[parts.length - 2] = el.value
                history.replaceState(null, "User Profile Page", parts.join('/'));
            }

        })
        .catch(error => {
            el.focus();
        });
}

document.addEventListener('DOMContentLoaded', function() {
    /*   data = {
            'user1_follows_user2': user1_follows_user2,
            'user2_follows_user1': user2_follows_user1,
            'user1_followed_by_user2': user1_followed_by_user2,
            'user2_followed_by_user1': user2_followed_by_user1,
            'already_friend': user1_makeFriend_user2 and user2_makeFriend_user1,
            'mutual_follow': user1_follows_user2 and user2_follows_user1 and user1_followed_by_user2 and user2_followed_by_user1,
        }*/

    const selfUsername = _getURLSelfUsername();
    const targetUsername = _getURLTargetUsername();
    const followButton = document.getElementById('follow-btn');
    const unfollowButton = document.getElementById('unfollow-btn');
    const relationInstruction = document.getElementById('relation');

    followButton.style.display = "none";
    unfollowButton.style.display = "none";

    fetch(`/api/user/${selfUsername}/anyRelations/${targetUsername}/`)
        .then(relationResponse => {
            if (!relationResponse.ok) {
                throw new Error('Network response was not ok.');
            }
            return relationResponse.json();
        })
        .then(relations => {
            if (relations["already_friend"]) {
                relationInstruction.textContent = `- ${targetUsername} Is Your Friend -`;
                followButton.style.display = "none";
                unfollowButton.style.display = "inline";
            }
            else if (relations["user1_follows_user2"] && relations["user2_followed_by_user1"]) {
                relationInstruction.textContent = `- You Are Following ${targetUsername} -`;
                followButton.style.display = "none";
                unfollowButton.style.display = "inline";
            }
            else if (relations["user2_follows_user1"] && relations["user1_followed_by_user2"]) {
                relationInstruction.textContent = `- ${targetUsername} Is Your Follower -`;
                followButton.style.display = "inline";
                unfollowButton.style.display = "none";
            }
            else {
                relationInstruction.textContent = `- Hi, I'm ${targetUsername}, Nice To Meet U -`;
                followButton.style.display = "inline";
                unfollowButton.style.display = "none";
            }
        })

    if (followButton) {
        followButton.addEventListener('click', function() {
            // Todo - Check if they are already friends, if not then continue the follow process:
            let areFriends = true;
            fetch(`/api/user/${selfUsername}/anyRelations/${targetUsername}/`)
                .then(relationResponse => {
                    if (!relationResponse.ok) {
                        throw new Error('Network response was not ok.');
                    }
                    return relationResponse.json();
                })
                .then(relations => {
                    areFriends = relations["already_friend"];
                    if (areFriends) {
                        alert("You are already friends!!");
                    }
                    else {
                        // Todo - For `USER_SELF`, set `USER_TARGET` as a following of `USER_SELF`:
                        fetch(`/api/user/${selfUsername}/followerOf/${targetUsername}/`, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken'),
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => {
                                if (response.ok) {
                                    // followButton.style.display = 'none';
                                    // unfollowButton.style.display = 'inline';

                                    // Todo - For `USER_TARGET`, set `USER_SELF` as a follower of `USER_TARGET`:
                                    fetch(`/api/user/${selfUsername}/following/${targetUsername}/`, {
                                        method: 'POST',
                                        headers: {
                                            'X-CSRFToken': getCookie('csrftoken'),
                                            'Content-Type': 'application/json'
                                        }
                                    })
                                        .then(response => {
                                            if (response.ok) {
                                                alert("Follow request sent successfully!");
                                                // Todo - For BOTH, if the two are following each other and being followed by each other,
                                                //  then activate the “friend mechanism”, remove their following & follower relations but
                                                //  keep a friend relation between them:
                                                fetch(`/api/user/${selfUsername}/anyRelations/${targetUsername}/`)
                                                    .then(relationResponse => {
                                                        if (relationResponse.ok) {
                                                            return relationResponse.json()
                                                        }
                                                    })
                                                    .then(relations => {
                                                        let isFriend = relations["mutual_follow"]
                                                        if (isFriend) {
                                                            // Todo - If relationships are valid, then process the “friend mechanism”:
                                                            fetch(`/api/user/${selfUsername}/friend/${targetUsername}/`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'X-CSRFToken': getCookie('csrftoken'),
                                                                    'Content-Type': 'application/json'
                                                                }
                                                            })
                                                                .then(relationResponse => {
                                                                    if (relationResponse.ok) {
                                                                        alert("You are friends now!!")
                                                                        return relationResponse.json()
                                                                    }
                                                                })
                                                                .catch(error => console.error('Error:', error));
                                                        }
                                                    })
                                                    .catch(error => console.error('Error:', error));
                                            }
                                        })
                                        .catch(error => console.error('Error:', error));
                                }
                                else {
                                    alert("Already Followed.");
                                }
                            })
                            .catch(error => console.error('Error:', error));
                    }
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        });
    }

    // Todo - Unfollow Logics:
    //  1. Only self follow other    >>      delete 1->2 follow-ship;
    //  2. we are friend            >>       delete 1<->2 friend-ship，add 2->1 follow-ship;
    if (unfollowButton) {
        unfollowButton.addEventListener('click', function() {
            alert("Cry");
            fetch(`/api/user/${selfUsername}/anyRelations/${targetUsername}/`)
                .then(relationResponse => {
                    if (!relationResponse.ok) {
                        throw new Error('Network response was not ok.');
                    }
                    return relationResponse.json();
                })
                .then(relations => {
                    if (relations["user1_follows_user2"] && relations["user2_followed_by_user1"]) {
                        fetch(`/api/user/${selfUsername}/unfollowerOf/${targetUsername}/`, {
                            method: 'DELETE',
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken'),
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok.');
                                }
                                return response.json();
                            })
                            .then(relations => {
                                fetch(`/api/user/${targetUsername}/unfollowing/${selfUsername}/`, {
                                    method: 'DELETE',
                                    headers: {
                                        'X-CSRFToken': getCookie('csrftoken'),
                                        'Content-Type': 'application/json'
                                    }
                                })
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error('Network response was not ok.');
                                        }
                                        else {
                                            alert("Unfollow Successfully.");
                                            unfollowButton.style.display = 'none';
                                            followButton.style.display = 'inline';
                                        }
                                        return response.json();
                                    })
                            })
                    }
                    else if (relations["already_friend"]) {
                        fetch(`/api/user/${selfUsername}/unfriend/${targetUsername}/`, {
                            method: 'DELETE',
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken'),
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok.');
                                }
                                else {
                                    alert(`Unfollow Successfully, ${targetUsername} Is Still Following You.`);
                                    unfollowButton.style.display = 'none';
                                    followButton.style.display = 'inline';
                                }
                                return response.json();
                            })

                    }
                })

        });
    }

});

// Load recent posts for the user
document.addEventListener('DOMContentLoaded', () => {
    const recentPostsContainer = document.getElementById('recent-posts');
    const username = recentPostsContainer.getAttribute('data-username');

    fetch(`/api/user/${username}/posts`)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            if (Array.isArray(data.posts)) {
                data.posts.forEach(post => {
                    let postElement = document.createElement('div');
                    postElement.className = 'post';

                    const postLink = document.createElement('a');
                    postLink.href = `/posts/${post.id}`;
                    postLink.className = 'post-link';

                    const datePosted = new Date(post.date_posted);
                    console.log(datePosted)
                    const formattedDate = formatDate(datePosted);

                    const contentHTML = `
                        <div class="content">
                        ${post.image ? `<img src="${post.image}" alt="" width="120" height="120"/>` : ''}
                            <div class="post-title">${post.title}
                            <div class="corner-icon">
                                ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown" padding: 0 10px; position: relative; margin-left: auto;></ion-icon>' : ''}
                                ${post.visibility === 'FRIENDS' ? '<ion-icon name="people" style="padding: 0 10px; position: relative; margin-left: auto;"></ion-icon>' : ''}
                                ${post.visibility === 'PRIVATE' ? '<ion-icon name="eye-off" style="padding: 0 10px; position: relative; margin-left: auto;"></ion-icon>' : ''}
                            </div>
                            </div>
                            <div class="post-time">${formattedDate}</div>
                            <p class="post-content">${post.content}</p>
                            ${createImagesHTML(post.image_data)}
                        </div>
                    `;
                    
                    postLink.innerHTML = contentHTML;
                    postElement.appendChild(postLink);
                    recentPostsContainer.appendChild(postElement);

                });
            }
            else {
                console.error('Error: Expected an array of posts');
                recentPostsContainer.innerHTML = '<p>Error loading posts.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            recentPostsContainer.innerHTML = '<p>Error loading posts.</p>';
        });
});


// Load friend list
document.addEventListener('DOMContentLoaded', () => {
    const friendListContainer = document.getElementById('friendList');
    const username = friendListContainer.getAttribute('data-username'); 

    fetch(`/api/user/${username}/friends/`)
        .then(response => response.json())
        .then(friendships => {
            // console.log(friendships.length);
            if (friendships.length === 0) {
                friendListContainer.style.display = 'none'; 
                return;
            }

            friendships.forEach(friendship => {

                let friend;
                if (friendship.user1.username === username){
                    friend = friendship.user2;
                } else {
                    return;
                }
                console.log(friend);
                
                let friendElement = document.createElement('div');
                friendElement.className = 'friend-info';

                friendElement.innerHTML = `
                <div class="friend-avatar">
                    <img src="${friend.avatar}" alt="Friend Avatar">
                </div>
                <div class="friend-name">
                    <a href="/profile/${username}/${friend.username}">${friend.username}</a> 
                </div>
                `;

                friendListContainer.appendChild(friendElement);
            });
        })
        .catch(error => {
            console.error('Error fetching friends:', error);
            friendListContainer.innerHTML = '<p>Error loading friends.</p>';
        });
});


function _getURLTargetUsername() {
    const pathSections = window.location.pathname.split('/').filter(Boolean);
    return pathSections[pathSections.length - 1];
}

function _getURLSelfUsername() {
    const pathSections = window.location.pathname.split('/').filter(Boolean);
    return pathSections[pathSections.length - 2];
}

function _getRelationAnalysis(relationResponse) {
    relationResponse = relationResponse.json()
    console.log('Relationship data:', relationResponse);
    return relationResponse.get("mutual_follow")
}

function createImagesHTML(imageDataString) {
    if (!imageDataString) return '';

    const imageDataArray = imageDataString.split(","); 
    let imagesHTML = '';

    for (let i = 1; i < imageDataArray.length; i += 2) {
        let base64Data = imageDataArray[i];
        if (base64Data.trim()) {
            imagesHTML += `<img src="data:image/jpeg;base64,${base64Data}" class="post-image" style="width: 30%; max-height: 500px; margin: 0 10px">`;
        }
    }
    return imagesHTML;
}


function getCookie(name){
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