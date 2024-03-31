var imageDatas = [];
var index = 0;
const previewContainer = document.getElementById('imagePreviewContainer');
 
document.addEventListener('DOMContentLoaded', function() {
    const postContainer = document.querySelector('.post-container');
    const postId = postContainer.getAttribute('data-post-id');
    const editButton = document.getElementById('edit-btn'); 
    const editTextModal = document.getElementById('editModal');
    const editImageModal = document.getElementById('editImageModal');
    const options= document.getElementById('options-container');
    const imageInput = document.getElementById('imageUpload');
    var postContent = document.getElementById('postContent');
    
    // Load the obtained data into the form
    editButton.addEventListener('click', function() {
        if (!postContent) {
            editImageModal.style.display = 'block';
            
            // fetch origin post data
            fetch(`/api/posts/${postId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                
                document.getElementById('titleInput2').value = data.title;
                var raw_image_data = data.image_data;
                // console.log("images>>>>>> ", imageDatas);
                var splitData = raw_image_data.split(',');
                
                for (var i = 0; i < splitData.length; i += 2) {      
                    var fullImageData = splitData[i] + ',' + splitData[i + 1];
                    imageDatas.push(fullImageData);
                    console.log(imageDatas);
                }

                index = imageDatas.length - 1;
                renderPreviewImages();

                const visibilitySelect = document.getElementById('visibility');
                for (let i = 0; i < visibilitySelect.options.length; i++) {
                    if (visibilitySelect.options[i].value === data.visibility) {
                        visibilitySelect.selectedIndex = i;
                        break;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching post data:', error);
            }); 


        } else {
            editTextModal.style.display = 'block';  // Show up edit modal
             

            // fetch origin post data
            fetch(`/api/posts/${postId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Load the obtained data into the form
                document.getElementById('titleInput').value = data.title;
                document.getElementById('contentInput').value = data.content;
                document.getElementById('content_type').checked = (data.content_type === 'COMMONMARK'); 
                const visibilitySelect = document.getElementById('visibility');
                for (let i = 0; i < visibilitySelect.options.length; i++) {
                    if (visibilitySelect.options[i].value === data.visibility) {
                        visibilitySelect.selectedIndex = i;
                        break;
                    }
                }

            })
            .catch(error => {
                console.error('Error fetching post data:', error);
            }); 
        }
        options.style.display = 'none';

    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === editTextModal) {
            editTextModal.style.display = "none";
        }
        if (event.target === editImageModal) {
            editImageModal.style.display = "none";
        }
    }

    // Upload new images
    imageInput.addEventListener('change', function(event) {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
 
            reader.onload = function(e) {
                var imageData = e.target.result;    // Get Base64 encoded image data
                imageDatas.push(imageData);     //Add image data to the global array
            
                // Preview images
                renderPreviewImages();
            
                index++;
                // console.log("len of imageDatas:",imageDatas.length,imageDatas);
                
            }
            reader.readAsDataURL(this.files[0]); 
        }
    });

    // Handling edit form submissions
    const editImageForm = document.getElementById('editImageForm');
    editImageForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Get new data from form
        const updatedTitle = document.getElementById('titleInput2').value;
        const updatedImageData = imageDatas.join(',');
        const updatedVisibility = document.getElementById('visibility').value;
        
        fetch(`/api/posts/${postId}/update/`, {
            method: 'PUT',  
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')  
            },
            body: JSON.stringify({ 
                title: updatedTitle, 
                image_data: updatedImageData,
                visibility: updatedVisibility
             })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Post updated:', data);
            editImageModal.style.display = 'none'; // Close modal after submit
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
        });

    });

    const editForm = document.getElementById('editForm');
    editForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Get new data from form
        const updatedTitle = document.getElementById('titleInput').value;
        const updatedContent = document.getElementById('contentInput').value;
        const updatedContentType = document.getElementById('content_type').checked ? 'COMMONMARK' : 'PLAIN'; 
        const updatedVisibility = document.getElementById('visibility').value;

        fetch(`/api/posts/${postId}/update/`, {
            method: 'PUT',  
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')  
            },
            body: JSON.stringify({ 
                title: updatedTitle, 
                content: updatedContent,
                content_type: updatedContentType,
                visibility: updatedVisibility
             })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Post updated:', data);
            editTextModal.style.display = 'none'; // Close modal after submit
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
        });

        
    });
});

// Click the x to close the pop-up window
function closeModal() {
    const editTextModal = document.getElementById('editModal');
    const editImageModal = document.getElementById('editImageModal');
    editImageModal.style.display = 'none';
    editTextModal.style.display = 'none';
    
}

function removeImage(index) {
    console.log("remove:",index);
    imageDatas.splice(index, 1); // Remove selected images from array
    renderPreviewImages(); // Re-render preview
    console.log("len of imageDatas:",imageDatas.length,imageDatas);
    index--;
}


function renderPreviewImages() {
    previewContainer.innerHTML = ''; 
    imageDatas.forEach((imageData, index) => {
        previewContainer.innerHTML += createPreviewHTML(imageData, index);
    });
}

function createPreviewHTML(imageData, index) {
    return `
        <div class="preview-wrapper">
            <img src="${imageData}" class="image-preview">
            <button class="delete-btn" onclick="removeImage(${index})">
                <ion-icon name="close-circle"></ion-icon></button>
        </div>
    `;
}