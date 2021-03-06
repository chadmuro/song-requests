const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// auth trigger (new user signup)
exports.newUserSignup = functions.auth.user().onCreate(user => {
	// for background triggers you must return a value/promise
	return admin.firestore().collection('users').doc(user.uid).set({
		email: user.email,
		upvotedOn: [],
	});
});

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete(user => {
	// for background triggers you must return a value/promise
	const doc = admin.firestore().collection('users').doc(user.uid);
	return doc.delete();
});

// http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {
	if (!context.auth) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'only authenticated users can add requests'
		);
	}
	if (data.title.length > 50 || data.artist.length > 50) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'request must be no more than 50 characters long'
		);
	}
	admin
		.firestore()
		.collection('requests')
		.add({
			title: data.title,
			artist: data.artist,
			upvotes: 0,
		})
		.then(() => {
			return 'new request added';
		})
		.catch(() => {
			throw new functions.https.HttpsError('internal', 'request not added');
		});
});

// upvote callable function
exports.upvote = functions.https.onCall(async (data, context) => {
	// check auth state
	if (!context.auth) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'only authenticated users can upvote requests'
		);
	}

	// get refs for user doc & request doc
	const user = admin.firestore().collection('users').doc(context.auth.uid);
	const request = admin.firestore().collection('requests').doc(data.id);

	const doc = await user.get();
	//check user hasn't already upvoted the request
	if (doc.data().upvotedOn.includes(data.id)) {
		throw new functions.https.HttpsError(
			'failed-precondition',
			'you can only upvote a request once'
		);
	}
	// update user array
	await user.update({
		upvotedOn: [...doc.data().upvotedOn, data.id],
	});
	// update votes on the request
	return request.update({
		upvotes: admin.firestore.FieldValue.increment(1),
	});
});
