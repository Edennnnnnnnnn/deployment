'use strict';

import {formatDate} from "./common.js";

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/pps/')
        .then(response => response.json())
        .then(posts => {
            const postContainer = document.getElementById('post-container');
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                const postLink = document.createElement('a');
                postLink.href = `/posts/${post.id}`;
                postLink.className = 'post-link';

                const datePosted = new Date(post.date_posted);
                const formattedDate = formatDate(datePosted)

                checkLikeStatusAndUpdateIcon(post.id);

                const userInfoHTML = `
                    <div class="user-info">
                        <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                        <div class="username">${post.username || 'Unknown User'}</div>
                        <div class="post-time">${formattedDate}</div>
                        <div class="corner-icon">
                            ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown" style="padding: 0 10px; position: relative; margin-left: auto;"></ion-icon>' : ''}
                        </div>
                    </div>
                `;

                const contentHTML = `
                    <div class="content">
                        <div class="title">${post.title}</div>
                        <p class="post-content">${post.content}</p>
                        ${createImagesHTML(post.image_data)}
                    </div>
                `;
                // <img src="${post.image_data}>

                const commentFormDiv = document.createElement('div');
                const commentFormHTML = `
                    <div class="comment-form" style="display:none;">
                        <textarea class="comment-text"></textarea>
                        <button class="submit-comment">Confirm</button>
                        <button class="cancel-comment">Cancel</button>
                    </div>
                `;

                const interactionDiv = document.createElement('div');
                const interactionHTML = `
                    <div class="interact-container">
                        <!-- <button id="share-${post.id}" type="button" data-post-id="${post.id}">
                            <ion-icon size="small" name="share-outline" style="margin-right: 8px;"></ion-icon>
                            Share <span class="share-count">${post.share_count}</span>
                        </button> -->
                        <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                            <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                            </ion-icon>
                                ${post.comment_count > 0 ? '' : 'Comment'} 
                                <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                            </span>
                        </button>
                        <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                            <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                            </ion-icon>
                                    ${post.likes_count > 0 ? '' : 'Like'}
                                <span class="like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                        </button>
                    </div>  
                `;

                // Append userInfoHTML and contentHTMLto postLink instead of postElement
                postLink.innerHTML = userInfoHTML + contentHTML;
                postElement.appendChild(postLink);
                commentFormDiv.innerHTML = commentFormHTML;
                postElement.appendChild(commentFormDiv);
                interactionDiv.innerHTML = interactionHTML;
                postElement.appendChild(interactionDiv);

                postContainer.appendChild(postElement);

                // comment listener
                const commentButton = postElement.querySelector(`button[data-post-id="${post.id}"]`);
                if (commentButton) {
                    commentButton.addEventListener('click', function() {
                        const commentForm = postElement.querySelector('.comment-form');
                        commentForm.style.display = 'block';
                    });
                }

                const cancelCommentButton = postElement.querySelector('.cancel-comment');
                cancelCommentButton.addEventListener('click', () => {
                    const commentForm = postElement.querySelector('.comment-form');
                    commentForm.style.display = 'none';
                    commentFormDiv.querySelector('.comment-text').value = '';
                });

                const submitCommentButton = postElement.querySelector('.submit-comment');
                submitCommentButton.addEventListener('click', () => {
                    const postId = post.id;
                    const commentText = commentFormDiv.querySelector('.comment-text').value.trim();
                    if (commentText === '') {
                        alert('Please enter a comment.');
                        return;
                    }

                    fetch(`/api/posts/${postId}/comments/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ comment_text: commentText })
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(() => {
                            const commentForm = postElement.querySelector('.comment-form');
                            commentForm.style.display = 'none';
                            commentFormDiv.querySelector('.comment-text').value = '';
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error posting comment.');
                        });
                });

                // like listener
                const likeButton = postElement.querySelector(`button[id="like-${post.id}"]`);
                if (likeButton) {
                    likeButton.addEventListener('click', () => {
                        // event.preventDefault();
                        toggleLike(post.id); // like function
                    });
                }

            });
            sortPostsByDate();
        })
        .catch(error => console.error('Error:', error));
})

function toggleLike(postId) {
    console.log('Like button clicked for post:', postId);
    fetch(`/api/posts/${postId}/likes/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'), // Get CSRF token
            'Content-Type': 'application/json'
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            checkLikeStatusAndUpdateIcon(postId);
            fetchLikes(postId);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function toggleLikeRemote(remoteNodeName, projUsername, postId) {
    // console.log('Like button clicked for post:', postId);
    // fetch(`/api/posts/${postId}/likes/`, {
        const remoteLikeURL = `/remote/posts/${encodeURIComponent(remoteNodeName)}/${encodeURIComponent(projUsername)}/${postId}/like/`;
        fetch(remoteLikeURL, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'), // Get CSRF token
            'Content-Type': 'application/json'
        },
    })
        .then(response => {
            if (response.status === 201) {
            checkRemoteLikeStatusAndUpdateIcon(remoteNodeName, projUsername, postId);
            } else if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // fetchLikes(postId);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function checkLikeStatusAndUpdateIcon(postId) {
    fetch(`/api/posts/${postId}/check-like/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'), // Get CSRF token
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            updateLikeIcon(postId, data.has_liked); // Update icon based on like status
        })
        .catch(error => console.error('Error checking like status:', error));
}

function checkRemoteLikeStatusAndUpdateIcon(remoteNodeName, projUsername, postId) {
    const remoteCheckLikeURL = `/remote/posts/${encodeURIComponent(remoteNodeName)}/${encodeURIComponent(projUsername)}/${postId}/check-like/`;
    fetch(remoteCheckLikeURL, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'), // Get CSRF token
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Additionally, update the likes count display
        updateLikesDisplay(data.likes_count, postId);
        // Update like icon based on the `has_liked` status
        updateLikeIcon(postId, data.has_liked);
    })
    .catch(error => console.error('Error checking remote like status:', error));
}


function updateLikeIcon(postId, isLiked) {
    console.log("hongxin")
    const likeButton = document.getElementById(`like-${postId}`);
    const likeIcon = likeButton.querySelector('ion-icon');

    if (isLiked) {
        likeIcon.setAttribute('name', 'heart');
        likeIcon.style.color = 'red'; // set to red
        console.log("liked")
    }
    else {
        likeIcon.setAttribute('name', 'heart-outline');
        likeIcon.style.color = '';
        console.log("didn't like")
    }
}

function fetchLikes(postId) {
    fetch(`/api/posts/${postId}/likes/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            updateLikesDisplay(data.length, postId);
        })
        .catch(error => {
            console.error('Error fetching likes:', error);
        });
}

function updateLikesDisplay(likesCount, postId) {
    const likeButton = document.getElementById(`like-${postId}`);
    // const likeCountElement = likeButton.querySelector('.like-count');
    if (likeButton) {
        if (likesCount > 0) {
            likeButton.innerHTML = `<ion-icon size="small" name="heart" style="margin-right: 8px;"></ion-icon><span class="like-count">${likesCount}</span>`;
        } else {
            likeButton.innerHTML = `<ion-icon size="small" name="heart-outline" style="margin-right: 8px;"></ion-icon>Like`;
        }
    }
    else {
        console.error('Like count span not found inside button for post:', postId);
    }
}


// TODO: fitting design
export function createRemotePostBlocks_0_enjoy(remotePosts) {
    console.log("@ remotePosts", remotePosts);
    const postContainer = document.getElementById('post-container');
    remotePosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const postLink = document.createElement('a');
        postLink.href = `/remoteprofile/enjoy/${post.author.displayName}/`;
        postLink.className = 'post-link';

        const datePosted = new Date(post.published);
        const formattedDate = formatDate(datePosted);

        const userInfoHTML = `
            <div class="user-info">
                <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                <div class="username">${post.author.displayName || 'Unknown User'}</div>
                <div class="post-time">${formattedDate}</div>
                <div class="corner-icon">
                    ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown"></ion-icon>' : ''}
                    <ion-icon name="earth"></ion-icon>
                </div>
            </div>
        `;

        const contentHTML = `
            <div class="content">
                <div class="title">${post.title}</div>
                ${isImageData(post.content) ? createImagesHTML(post.content) : `<p class="remote-post-content">${post.content}</p>`}
                
            </div>
        `;

        const interactionHTML = `
            <div class="interact-container">
                <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                    <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                    </ion-icon>
                        ${post.comment_count > 0 ? '' : 'Comment'} 
                        <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                    </span>
                </button>
                <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                    <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                    </ion-icon>
                            ${post.likes_count > 0 ? '' : 'Like'}
                        <span class="like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
            </div>
        `;

        postLink.innerHTML = userInfoHTML + contentHTML + interactionHTML;
        postElement.appendChild(postLink);
        // postElement.innerHTML += interactionHTML;
        postContainer.appendChild(postElement);
    });
    sortPostsByDate();
}


export function createRemotePostBlocks_1_200OK(remotePosts) {
    console.log("@ remotePosts", remotePosts);
    const postContainer = document.getElementById('post-container');

    remotePosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const postLink = document.createElement('a');
        // console.log("post", post)
        postLink.href = `/remoteprofile/200OK/${post.author.displayName}/`;
        postLink.className = 'post-link';

        const datePosted = new Date(post.published);
        const formattedDate = formatDate(datePosted);

        const userInfoHTML = `
            <div class="user-info">
                <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                <div class="username">${post.author.displayName || 'Unknown User'}</div>
                <div class="post-time">${formattedDate}</div>
                <div class="corner-icon">
                    ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown"></ion-icon>' : ''}
                    <ion-icon name="earth"></ion-icon>
                </div>
            </div>
        `;

        const contentHTML = `
            <div class="content">
                <div class="title">${post.title}</div>
                ${isImageData(post.content) ? createImagesHTML(post.content) : `<p class="remote-post-content">${post.content}</p>`}
            </div>
        `;

        let postId = post.id.split('/').slice(-1)[0]
        const interactionHTML = `
            <div class="interact-container">
                <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                    <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                    </ion-icon>
                        ${post.comment_count > 0 ? '' : 'Comment'} 
                        <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                    </span>
                </button>
                <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                    <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                    </ion-icon><div id="${postId}-like-style">${post.likes_count > 0 ? '' : 'Like'}</div>
                        <span class="like-count" id="${postId}-like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
                
            </div>
           
        `;
        const commentHTML = `
            <div id="comment-modal-${post.id}" style="display:none;">
                <textarea id="comment-text-${post.id}"></textarea>
                <button id="submit-comment-${post.id}">Confirm</button>
                <button id="cancel-comment-${post.id}">Cancel</button>
            </div>
        `;

        postLink.innerHTML = userInfoHTML + contentHTML;
        postElement.appendChild(postLink);
        postElement.innerHTML = postElement.innerHTML + interactionHTML + commentHTML;
        postContainer.appendChild(postElement);

        const commentButton = postElement.querySelector(`button[data-post-id="${post.id}"]`);
        const commentModal = document.getElementById(`comment-modal-${post.id}`);
        const submitCommentButton = document.getElementById(`submit-comment-${post.id}`);
        const cancelCommentButton = document.getElementById(`cancel-comment-${post.id}`);
        const commentInput = document.getElementById(`comment-text-${post.id}`);
        if (commentButton) {
            commentButton.addEventListener('click', function() {

                // display the input box
                commentModal.style.display = commentModal.style.display === 'block' ? 'none' : 'block';

                // submitCommentButton.setAttribute('data-post-id', post.id);
                submitCommentButton.addEventListener('click', () => {
                    const commentText = commentInput.value.trim();
                    if (commentText === '') {
                        alert('Please enter a comment.');
                        return;
                    }

                    let postId = post.id.split('/').slice(-1)[0]
                    let host = post.author.host.split('/')[2]

                    fetch(`/remote/posts/${host}/${post.author.displayName}/${postId}/comments/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ comment_text: commentText })
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(() => {
                            document.getElementById('comment-modal').style.display = 'none';
                            document.getElementById('comment-text').value = ''; // clear the input box
                            alert('Success posting comment.');
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error posting comment.');
                        });
                    commentModal.style.display = 'none';
                    commentInput.value = '';
                });
            });
        }
        cancelCommentButton.addEventListener('click', () => {
            console.log("cancel button clicked");
            commentInput.value = ''; // clear the input box
        });

        const likeButton = document.getElementById(`like-${post.id}`)
        likeButton.addEventListener('click', () => {
            console.log(post)

            let postId = post.id.split('/').slice(-1)[0]
            let host = post.author.host.split('/')[2]
            console.log(postId)
            fetch(`/remote/posts/${host}/${post.author.displayName}/${postId}/like/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
            })
                .then(response => {
                    return response.json();
                })
                .then((data) => {
                    if (data.message){
                        alert('Success posting Like.');
                        let like = document.getElementById(`${postId}-like-count`)
                        like.innerText = like.innerText + 1
                        let likeBtn = document.getElementById(`${postId}-like-style`)
                        likeBtn.innerText = ''
                    }else{
                        alert(`${data.error || data.detail}`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error posting Like.');
                });
        })
    });
    sortPostsByDate();
}


export function createRemotePostBlocks_2_hero(remotePosts) {
    console.log("@ remotePosts", remotePosts);
    const postContainer = document.getElementById('post-container');
    remotePosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const postLink = document.createElement('a');
        postLink.href = `/remoteprofile/hero/${post.username}`;
        postLink.className = 'post-link';

        const datePosted = new Date(post.date_posted);
        const formattedDate = formatDate(datePosted);

        checkRemoteLikeStatusAndUpdateIcon('hero', post.username, post.id)

        const userInfoHTML = `
            <div class="user-info">
                <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                <div class="username">${post.username || 'Unknown User'}</div>
                <div class="post-time">${formattedDate}</div>
                <div class="corner-icon">
                    ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown"></ion-icon>' : ''}
                    <ion-icon name="earth"></ion-icon>
                </div>
            </div>
        `;

        const contentHTML = `
            <div class="content">
                <div class="title">${post.title}</div>
                <p class="post-content">${post.content}</p>
                ${createImagesHTML(post.image_data)}
                
            </div>
        `;

        const commentFormDiv = document.createElement('div');
        const commentFormHTML = `
            <div class="comment-form" style="display:none;">
                <textarea class="comment-text"></textarea>
                <button class="submit-comment">Confirm</button>
                <button class="cancel-comment">Cancel</button>
            </div>
        `;

        const interactionDiv = document.createElement('div');
        const interactionHTML = `
            <div class="interact-container">
                <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                    <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                    </ion-icon>
                        ${post.comment_count > 0 ? '' : 'Comment'} 
                        <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                    </span>
                </button>
                <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                    <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                    </ion-icon>
                            ${post.likes_count > 0 ? '' : 'Like'}
                        <span class="like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
            </div>  
        `;

        postLink.innerHTML = userInfoHTML + contentHTML;
        postElement.appendChild(postLink);
        commentFormDiv.innerHTML = commentFormHTML;
        postElement.appendChild(commentFormDiv);
        interactionDiv.innerHTML = interactionHTML;
        postElement.appendChild(interactionDiv);
        postContainer.appendChild(postElement);
        
        // comment listener
        const commentButton = postElement.querySelector(`button[data-post-id="${post.id}"]`);
        if (commentButton) {
            commentButton.addEventListener('click', function() {
                const commentForm = postElement.querySelector('.comment-form');
                commentForm.style.display = 'block';
            });
        }

        const cancelCommentButton = postElement.querySelector('.cancel-comment');
        cancelCommentButton.addEventListener('click', () => {
            const commentForm = postElement.querySelector('.comment-form');
            commentForm.style.display = 'none';
            commentFormDiv.querySelector('.comment-text').value = '';
        });

        const submitCommentButton = postElement.querySelector('.submit-comment');
        submitCommentButton.addEventListener('click', () => {
            const postId = post.id;
            const postUsername = post.username;
            const serverName = 'hero';
            const commentText = commentFormDiv.querySelector('.comment-text').value.trim();
            if (commentText === '') {
                alert('Please enter a comment.');
                return;
            }

            const remoteCommentURL = `/remote/posts/${serverName}/${postUsername}/${postId}/comments/`;
            fetch(remoteCommentURL, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment_text: commentText })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    const commentForm = postElement.querySelector('.comment-form');
                    commentForm.style.display = 'none';
                    commentFormDiv.querySelector('.comment-text').value = '';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error posting comment.');
                });
        });

        // like listener
        const likeButton = postElement.querySelector(`button[id="like-${post.id}"]`);
        if (likeButton) {
            likeButton.addEventListener('click', () => {
                // toggleLike(post.id); // like function
                toggleLikeRemote('hero', post.username, post.id)
            });
        }
    });
    sortPostsByDate();
}


window.addEventListener('pageshow', function(event) {
    if (sessionStorage.getItem('refreshOnBack') === 'true') {
        sessionStorage.removeItem('refreshOnBack');
        window.location.reload();
    }
});

function createImagesHTML(imageDataString) {
    if (!imageDataString) return '';

    const imageDataArray = imageDataString.split(",");
    let imagesHTML = '';

    for (let i = 0; i < imageDataArray.length; i += 2) {
        let base64Type = imageDataArray[i]; // 文件类型
        let base64Data = imageDataArray[i + 1]; // 图片数据

        if (base64Type && base64Data) {
            imagesHTML += `<img src="${base64Type},${base64Data}" class="post-image" style="width: 30%; max-height: 500px; margin: 0 10px">`;
        }
    }
    return imagesHTML;
}


function isImageData(content) {
    // Check if the content starts with 'data:image'
    return content.trim().startsWith('data:image');
}

function sortPostsByDate() {
    const postContainer = document.getElementById('post-container');
    const posts = postContainer.querySelectorAll('.post');

    // 将帖子元素转换为数组，并根据日期排序
    const sortedPosts = Array.from(posts).sort((a, b) => {
        const dateA = new Date(a.querySelector('.post-time').innerText);
        const dateB = new Date(b.querySelector('.post-time').innerText);
        return dateB - dateA; // 降序排序
    });

    // 清空原有的帖子容器
    postContainer.innerHTML = '';

    // 将排序后的帖子重新追加到帖子容器中
    sortedPosts.forEach(post => {
        postContainer.appendChild(post);
    });
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