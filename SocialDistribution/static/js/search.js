// search.js

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
  
    if (!searchForm) {
        console.error('Search form not found');
        return;
    }

    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const currentUserInput = searchForm.querySelector('input[name="user1_id"]');
        const searchQueryInput = searchForm.querySelector('input[name="user2_id"]');
        
        if (!currentUserInput || !searchQueryInput) {
            console.error('Input fields not found');
            return;
        }

        const currentUser = currentUserInput.value;
        const searchQuery = searchQueryInput.value;
        console.log(currentUser, searchQuery);


        fetch(`/search?q=${encodeURIComponent(searchQuery)}`)
            .then(response => response.json())
            .then(data => {
                if (data.url) {
                    // User exist, redirect to the profile
                    fetch(`profile/${currentUser}/${searchQuery}`)
                        .then(response => {
                            if (!response.ok) {
                                alert("User not found");
                            }
                             window.location.href = `profile/${currentUser}/${searchQuery}`;
                        })
                } else {
                    // user not exist
                    alert("User not found");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("An error occurred while searching");
            });
    });
});
