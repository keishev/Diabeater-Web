// src/Models/Nutritionist.js
class Nutritionist {
    constructor(id, firstName, lastName, email, dob, certificateUrl, status = 'pending', createdAt = new Date()) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.dob = dob;
        this.certificateUrl = certificateUrl;
        this.status = status; // 'pending', 'approved', 'rejected'
        this.createdAt = createdAt; // Timestamp of creation
    }

    toFirestore() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            dob: this.dob,
            certificateUrl: this.certificateUrl,
            status: this.status,
            createdAt: this.createdAt
        };
    }

    static fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return new Nutritionist(
            snapshot.id,
            data.firstName,
            data.lastName,
            data.email,
            data.dob,
            data.certificateUrl,
            data.status,
            data.createdAt ? data.createdAt.toDate() : null // Convert Firestore Timestamp to Date
        );
    }
}

export default Nutritionist;