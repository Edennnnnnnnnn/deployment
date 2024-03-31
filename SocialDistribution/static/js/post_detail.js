'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const moreOptionsButton = document.getElementById('more-options-button');
    const optionsContainer = document.getElementById('options-container');
    const likeButton = document.getElementById('like-button');
    const likeCountElement = document.getElementById('like-count');
    const postContainer = document.querySelector('.post-container');
    const postId = postContainer.getAttribute('data-post-id');
    const commentButton = document.getElementById('comment-button');
    const commentForm = document.getElementById('comment-form');
    const submitCommentButton = document.getElementById('submit-comment');
    const cancelCommentButton = document.getElementById('cancel-comment');
    const commentInput = document.getElementById('comment-input');
    const shareButton = document.getElementById('share-button');
    var shareModal = document.getElementById('shareModal');
    var confirmShare = document.getElementById('confirmShare');
    var shareText = document.getElementById('shareText');
    var postContent = document.getElementById('postContent');

    fetch(`/api/posts/${postId}`)
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showError("Sorry, you do not have permission to view this post.");
                if (postContainer) { // make sure post container exists
                    postContainer.style.display = 'none';
                }
                postContent.textContent = "Sorry, you do not have permission to view this post.";
                postContent.style.display = 'block';
                
                if (likeButton) likeButton.style.visibility = 'hidden';
                if (commentButton) commentButton.style.visibility = 'hidden';
                if (shareButton) shareButton.style.visibility = 'hidden';

                const returnButton = document.createElement('button');
                returnButton.textContent = 'Return';
                returnButton.classList.add('return-button');

                returnButton.addEventListener('click', function() {
                    window.history.back();
                });
                document.body.appendChild(returnButton);

            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            return response.json();
        }
    })
    .then(data => {
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });

    checkLikeStatusAndUpdateIcon(postId);

    if (moreOptionsButton) {
        moreOptionsButton.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth' 
            });
            if (optionsContainer.style.display === 'none') {
                optionsContainer.style.display = 'block';
            } else {
                optionsContainer.style.display = 'none';
            }
        });
    }

    if (likeButton) {
        likeButton.addEventListener('click', function () {
            // const likeCount = parseInt(likeCountElement.textContent, 10);

            console.log('Like button clicked for post:', postId);

            fetch(`/api/posts/${postId}/likes/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') // Get CSRF token
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    checkLikeStatusAndUpdateIcon(postId);
                })
                .then(data => {
                    fetchLikes();
                    // likeCountElement.textContent = data.likes_count;
                    likeButton.classList.add('liked');
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        });
    }

    if (commentButton) {
        fetchComments();
        commentButton.addEventListener('click', function () {
            if (commentForm.style.display === 'block' || commentForm.style.display === '') {
                commentForm.style.display = 'none'; // Hide the comment form
            } else {
                commentForm.style.display = 'block'; // Show the comment form
            }
        });

        // Event listener for submitting a comment
        submitCommentButton.addEventListener('click', function () {
            const commentText = commentInput.value.trim();

            commentInput.style.height = 'initial';

            if (commentText === '') {
                alert('Please enter a comment.');
                return;
            }

            // Proceed with submitting the comment
            fetch(`/api/posts/${postId}/comments/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({comment_text: commentText})
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                    }
                })
                .then(() => {
                    fetchComments();
                    commentInput.value = ''; // Clear the input field
                    commentForm.style.display = 'none'; // Hide the comment form again
                    
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('Error message:', error.message);
                    alert(error.message);
                });
        });

        // cancelCommentButton.addEventListener('click', function() {
        //     commentInput.value = ''; // Clear <textarea> 
        //     commentInput.style.height = 'initial';
        // });
        cancelCommentButton.addEventListener('click', function() {
            commentInput.value = ''; // Clear <textarea>
            const commentForm = document.getElementById('comment-form');
            if (commentForm.style.display !== 'none') {
                commentForm.style.display = 'none'; // Hide the comment form
            } else {
                commentForm.style.display = 'flex'; // Re-display the comment form if needed
            }
        });        
    }

    

    if (shareButton) {
        shareButton.addEventListener('click', function () {
            shareModal.style.display = "block";
        });
    }


    // when user clicks the outside of the model, close the model
    window.onclick = function (event) {
        if (event.target == shareModal) {
            shareModal.style.display = "none";
        }
    }

    confirmShare.onclick = function () {
        // type thoughts of the post
        var text = shareText.value;

        fetch(`/api/posts/${postId}/share/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({text: text})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('Post shared successfully', data.post_id);
                    showNotification('Post shared successfully!');
                    // Update UI design to see repost style
                } else {
                    console.error('Failed to share the post');
                    showNotification('Failed to share the post, please try again later!');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Failed to share the post, please try again later!');
            });

        shareModal.style.display = "none";
        shareText.value = '';
    }
    showImage();    
    // if (!postContent){showImage();}

});

document.getElementById('comments-container').addEventListener('click', function(event) {
    function findDeleteButton(target) {
        while (target != null && target !== this) {
            if (target.classList.contains('comment-delete-btn')) {
                return target;
            }
            target = target.parentElement;
        }
        return null;
    }

    const deleteBtn = findDeleteButton(event.target);
    if (deleteBtn) {
        const commentId = deleteBtn.getAttribute('data-comment-id');
        const postContainer = document.querySelector('.post-container');
        const postId = postContainer.getAttribute('data-post-id');
        deleteComment(postId, commentId);
    }
});

function goBackAndRefresh() {
    sessionStorage.setItem('refreshOnBack', 'true');
    history.back();
}

function checkLikeStatusAndUpdateIcon(postId) {
    fetch(`/api/posts/${postId}/check-like/`)
        .then(response => response.json())
        .then(data => {
            updateLikeIcon(data.has_liked);
        })
        .catch(error => console.error('Error:', error));
}

function updateLikeIcon(isLiked) {
    const likeIcon = document.getElementById('like-icon');

    if (isLiked) {
        likeIcon.setAttribute('name', 'heart');
        likeIcon.style.color = 'red';
    } else {
        likeIcon.setAttribute('name', 'heart-outline');
    }
}

function fetchLikes() {
    const postContainer = document.querySelector('.post-container');
    if (!postContainer) {
        console.log('Post container not found, skipping likes fetch.');
        return;
    }

    const postId = postContainer.getAttribute('data-post-id');
    if (!postId) {
        console.error('No post ID found for fetching likes.');
        return;
    }

    fetch(`/api/posts/${postId}/likes/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            updateLikesDisplay(data.length);
        })
        .catch(error => {
            console.error('Error fetching likes:', error);
        });
}

function updateLikesDisplay(likesCount) {
    console.log('Updating likes count:', likesCount);
    const likesCountElement = document.getElementById('like-count');
    if (likesCountElement) {
        likesCountElement.textContent = likesCount;
    }
}

function fetchComments() {
    const postContainer = document.querySelector('.post-container');
    if (!postContainer) {
        console.log('Post container not found, skipping comments fetch.');
        return;
    }

    const postId = postContainer.getAttribute('data-post-id');
    if (!postId) {
        console.error('No post ID found for fetching comments.');
        return;
    }

    fetch(`/api/posts/${postId}/comments/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            renderComments(data);
        })
        .catch(error => {
            console.error('Error:', error);
            console.log('Error message:', error.message);
            alert(error.message);
        });
}

function renderComments(comments) {
    const commentsContainer = document.getElementById('comments-container');
    commentsContainer.innerHTML = '';

    comments.forEach(comment => {
        // Create Content Container

        const dateCommented = new Date(comment.date_commented);
        const formattedDate = `${dateCommented.getFullYear()}-${dateCommented.getMonth() + 1}-${dateCommented.getDate()}`;

        const deleteButtonHTML = comment.can_delete ? 
            `<button class="comment-delete-btn" data-comment-id="${comment.id}">
                <ion-icon name="trash-outline"></ion-icon>
            </button>` : '';
        
        const commentHTML = `
            <div class="comment" data-comment-id="${comment.id}">  
                <div class="comment-avatar">
                    <img src="${comment.commenter_avatar_url}" alt="User Avatar">
                </div>
                <div class="comment-body">
                    <div class="comment-header">
                        <div class="comment-user-name">${comment.commenter_username}</div>
                        <div class="comment-time">${formattedDate}</div>
                        ${deleteButtonHTML}
                    </div> 
                        <p class="comment-text">${comment.comment_text}</p>
                
                </div>  
            </div>
        `;

        commentsContainer.innerHTML += commentHTML;
        
    });
}

function deleteComment(postId, commentId) {
    fetch(`/api/posts/${postId}/comments/${commentId}/delete/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete the comment.');
        }
        if (response.status === 204) {
            return null;
        } else {
            return response.json(); 
        }
    })
    .then(() => {
        alert('Comment deleted successfully.');
        // after deleting, fetch comments.
        fetchComments();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting comment.');
    });
}

function deletePost(button) {
    const postId = button.getAttribute('data-post-id');
    if (confirm("Are you sure you want to delete this post?")) {
        fetch(`/api/posts/${postId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        }).then(response => {
            if (response.status === 204) {
                showNotification('Post Deleted.');
                setTimeout(function () {
                    window.history.back();
                }, 1000);


            } else {
                alert("Something went wrong.");
            }
        }).catch(error => console.error('Error:', error));
    }
}

function showNotification(message) {
    console.log('showNotification called with message:', message);
    var notification = document.getElementById('notification');
    console.log(notification);
    notification.textContent = message;
    notification.style.display = 'block';

    // Hide the notification after 3 seconds
    setTimeout(function () {
        console.log('Hiding notification');
        notification.style.display = 'none';
    }, 3000);
}

function showError(message) {
    console.log('showNotification called with message:', message);
    var notification = document.getElementById('notification');
    console.log(notification);
    notification.textContent = message;
    notification.style.display = 'block';
}

function closeShareModal() {
    const shareModal = document.getElementById('shareModal');
    shareModal.style.display = 'none';
}

function redirectProfile() {
    var el = document.getElementById("userName")
    var currentUser = document.body.getAttribute('data-current-user');
    window.location = `/profile/${currentUser}/${el.innerText}`
    window.onload = () => {
        window.location.reload();
    }
}

function userLinkProfile(targetUsername) {
    var currentUser = document.body.getAttribute('data-current-user');
    window.location.href = `/profile/${currentUser}/${targetUsername}`;
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


// Draft Post Actions

function EditPost() {
    var postTitle = document.getElementById("postTitle")
    var postContent = document.getElementById("postContent")

    var titleInput = document.getElementById("titleInput")
    titleInput.value = postTitle.innerText
    var contentInput = document.getElementById("contentInput")
    contentInput.value = postContent.innerText

    const modal = document.getElementById("editModal");
    modal.style.display = 'block'
}



function sendPost() {
    var modal = document.getElementById('editModal')
    var data = {
        title: document.getElementById("postTitle").innerText,
        content: document.getElementById("postContent").innerText,
    }

    var postId = document.getElementById("postId").innerText

    // Send AJAX request to server
    fetch(`/api/posts/${postId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),   //Get CSRF token
            'Content-type': 'application/json'
        },
        credentials: 'same-origin'   //For CSRF token verification
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Something went wrong');
            }
        })
        .then(data => {
            //After posted
            modal.style.display = "none";   //Close pop-up window
            window.location = '/'
            window.onload = function () {
                location.reload();
            };
        })
        .catch((error) => {
            console.error('Error:', error);
            // Add error message
        });
}

function autoResizeTextarea() {
    var textareas = document.querySelectorAll('#comment-input');

    textareas.forEach(function(textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight-2+'px' ;
        });
    });
}
document.addEventListener('DOMContentLoaded', autoResizeTextarea);

function showImage() {
    const postContainer = document.querySelector('.post-container');
    const postId = postContainer.getAttribute('data-post-id');
    
    fetch(`/api/posts/${postId}`) // Get image data from backend
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); 
    })
    .then(data => {
        // process data
        var imageDataString = data.image_data; // get image_data string
        
        var imageDataArray = imageDataString.split(",");
        
        for (var i = 1; i < imageDataArray.length; i += 2) {
            var base64Data = imageDataArray[i]; // Extract Base64 encoded part
            // Create img tag and display image
            var img = document.createElement("img");
            img.src = "data:image/jpeg;base64," + base64Data; // add "data:image/jpeg;base64," header
            img.classList.add("post-image"); // add css style
            
            document.getElementById("imageContainer").appendChild(img);
        }   
        
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}
