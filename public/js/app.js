const requestModal = document.querySelector('.new-request');
const requestLink = document.querySelector('.add-request');
const requestForm = document.querySelector('.new-request form');

// open request modal
requestLink.addEventListener('click', () => {
	requestModal.classList.add('open');
});

// close request modal
requestModal.addEventListener('click', e => {
	if (e.target.classList.contains('new-request')) {
		requestModal.classList.remove('open');
		requestForm.querySelector('.error').textContent = '';
		requestForm.reset();
	}
});

// add a new request
requestForm.addEventListener('submit', e => {
	e.preventDefault();
	const addRequest = firebase.functions().httpsCallable('addRequest');
	addRequest({
		title: requestForm.title.value,
		artist: requestForm.artist.value,
	})
		.then(() => {
			requestForm.reset();
			requestModal.classList.remove('open');
			requestForm.querySelector('.error').textContent = '';
		})
		.catch(error => {
			requestForm.querySelector('.error').textContent = error.message;
		});
});

// notification
const notification = document.querySelector('.notification');

const showNotification = message => {
	notification.textContent = message;
	notification.classList.add('active');
	setTimeout(() => {
		notification.classList.remove('active');
		notification.textContent = '';
	}, 4000);
};
