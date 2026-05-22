from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from unittest.mock import patch
from rest_framework.test import APITestCase

from .models import ActionOTP, Diploma, SubscriptionPlan, UserProfile


class RegisterViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.subscription_plan, _ = SubscriptionPlan.objects.get_or_create(
			name="ESSENTIEL",
			defaults={
				"display_name": "Essentiel",
				"annual_price": "990.00",
				"max_diplomas": 50,
				"level": 1,
			},
		)

	def test_register_creates_user_and_profile(self):
		payload = {
			"username": "ecole-test",
			"email": "contact@ecole-test.fr",
			"password": "StrongPass!123",
			"rectorate_email": "rectorat@ecole-test.fr",
			"subscription_plan": "ESSENTIEL",
			"gdpr_consent": True,
			"school_name": "Lycée Test",
			"school_city": "Paris",
		}

		response = self.client.post("/api/register/", payload, format="json")

		self.assertEqual(response.status_code, 201)
		self.assertIn("profil rectorat", response.data["message"])

		user = User.objects.get(username="ecole-test")
		profile = UserProfile.objects.get(user=user)

		self.assertEqual(user.email, "contact@ecole-test.fr")
		self.assertTrue(user.check_password("StrongPass!123"))
		self.assertEqual(profile.rectorate_email, "rectorat@ecole-test.fr")
		self.assertEqual(profile.subscription_plan, self.subscription_plan)
		self.assertTrue(profile.gdpr_consent)
		self.assertIsNotNone(profile.gdpr_consent_date)
		self.assertEqual(profile.school_name, "Lycée Test")
		self.assertEqual(profile.school_city, "Paris")


class LoginViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.user = User.objects.create_user(
			username="ecole-login",
			email="contact@ecole-login.fr",
			password="StrongPass!123"
		)

	def test_login_with_valid_credentials(self):
		"""Test successful login returns user_id and username"""
		payload = {
			"username": "ecole-login",
			"password": "StrongPass!123"
		}

		response = self.client.post("/api/login/", payload, format="json")

		self.assertEqual(response.status_code, 200)
		self.assertIn("user_id", response.data)
		self.assertIn("username", response.data)
		self.assertEqual(response.data["username"], "ecole-login")
		self.assertEqual(response.data["user_id"], self.user.id)

	def test_login_with_invalid_password(self):
		"""Test login with wrong password returns 401"""
		payload = {
			"username": "ecole-login",
			"password": "WrongPassword!123"
		}

		response = self.client.post("/api/login/", payload, format="json")

		self.assertEqual(response.status_code, 401)
		self.assertIn("error", response.data)
		self.assertEqual(response.data["error"], "Identifiants invalides")

	def test_login_with_nonexistent_user(self):
		"""Test login with non-existent username returns 401"""
		payload = {
			"username": "nonexistent-user",
			"password": "StrongPass!123"
		}

		response = self.client.post("/api/login/", payload, format="json")

		self.assertEqual(response.status_code, 401)
		self.assertIn("error", response.data)
		self.assertEqual(response.data["error"], "Identifiants invalides")


class SendActionOTPViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.user = User.objects.create_user(
			username="ecole-otp",
			email="contact@ecole-otp.fr",
			password="StrongPass!123",
		)

	@patch("diplomas.views._send_mail_async")
	@patch("random.randint", return_value=123456)
	def test_send_action_otp_creates_code_and_invalidates_previous_ones(self, mock_randint, mock_send_mail_async):
		ActionOTP.objects.create(
			user=self.user,
			action_type="UPDATE_PROFILE",
			code="111111",
			expires_at=timezone.now() + timezone.timedelta(minutes=10),
		)

		response = self.client.post(
			"/api/send-action-otp/",
			{
				"user_id": self.user.id,
				"action_type": "UPDATE_PROFILE",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["status"], "sent")
		self.assertEqual(response.data["email_masked"], "co***@ecole-otp.fr")
		self.assertIn("10 minutes", response.data["message"])
		self.assertEqual(ActionOTP.objects.filter(user=self.user, action_type="UPDATE_PROFILE").count(), 2)
		self.assertTrue(ActionOTP.objects.get(user=self.user, action_type="UPDATE_PROFILE", code="111111").used)
		new_otp = ActionOTP.objects.get(user=self.user, action_type="UPDATE_PROFILE", code="123456")
		self.assertFalse(new_otp.used)
		self.assertGreater(new_otp.expires_at, timezone.now())
		mock_send_mail_async.assert_called_once()

	def test_send_action_otp_rejects_invalid_action(self):
		response = self.client.post(
			"/api/send-action-otp/",
			{
				"user_id": self.user.id,
				"action_type": "INVALID_ACTION",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 400)
		self.assertIn("action_type", response.data["error"])

	def test_send_action_otp_rejects_unknown_user(self):
		response = self.client.post(
			"/api/send-action-otp/",
			{
				"user_id": 9999,
				"action_type": "UPDATE_PROFILE",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 404)
		self.assertIn("Utilisateur introuvable", response.data["error"])


class CreateDiplomaViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.subscription_plan, _ = SubscriptionPlan.objects.get_or_create(
			name="ESSENTIEL",
			defaults={
				"display_name": "Essentiel",
				"annual_price": "990.00",
				"max_diplomas": 50,
				"level": 1,
			},
		)
		cls.user = User.objects.create_user(
			username="ecole-diploma",
			email="contact@ecole-diploma.fr",
			password="StrongPass!123",
		)
		UserProfile.objects.create(
			user=cls.user,
			rectorate_email="rectorat@ecole-diploma.fr",
			subscription_plan=cls.subscription_plan,
			gdpr_consent=True,
			gdpr_consent_date=timezone.now(),
		)

	def test_create_diploma_successfully(self):
		ActionOTP.objects.create(
			user=self.user,
			action_type="CREATE_DIPLOMA",
			code="123456",
			expires_at=timezone.now() + timezone.timedelta(minutes=10),
		)
		payload = {
			"user_id": str(self.user.id),
			"otp_code": "123456",
			"first_name": "Jean",
			"last_name": "Dupont",
			"course_name": "Master Blockchain",
			"image": SimpleUploadedFile("diploma.png", b"fake image content", content_type="image/png"),
			"embed_qr": "false",
		}

		response = self.client.post("/api/certify/", payload, format="multipart")

		self.assertEqual(response.status_code, 201)
		self.assertIn("validation envoy", response.data["message"])
		self.assertIn("diploma_id", response.data)
		self.assertIn("verify_url", response.data)

		diploma = Diploma.objects.get(pk=response.data["diploma_id"])
		otp = ActionOTP.objects.get(user=self.user, action_type="CREATE_DIPLOMA", code="123456")

		self.assertEqual(diploma.owner, self.user)
		self.assertEqual(diploma.first_name, "Jean")
		self.assertEqual(diploma.last_name, "Dupont")
		self.assertEqual(diploma.course_name, "Master Blockchain")
		self.assertEqual(diploma.rectorate_email_snapshot, "rectorat@ecole-diploma.fr")
		self.assertTrue(diploma.diploma_hash)
		self.assertEqual(diploma.status, "PENDING")
		self.assertTrue(otp.used)

	def test_create_diploma_without_user_id_returns_forbidden(self):
		response = self.client.post(
			"/api/certify/",
			{
				"otp_code": "123456",
				"first_name": "Jean",
				"last_name": "Dupont",
				"course_name": "Master Blockchain",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 403)
		self.assertIn("authentifi", response.data["error"])


class UpdateProfileViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.subscription_plan, _ = SubscriptionPlan.objects.get_or_create(
			name="ESSENTIEL",
			defaults={
				"display_name": "Essentiel",
				"annual_price": "990.00",
				"max_diplomas": 50,
				"level": 1,
			},
		)
		cls.user = User.objects.create_user(
			username="ecole-profile",
			email="contact@ecole-profile.fr",
			password="StrongPass!123",
		)
		cls.profile = UserProfile.objects.create(
			user=cls.user,
			rectorate_email="rectorat@ecole-profile.fr",
			subscription_plan=cls.subscription_plan,
			gdpr_consent=True,
			gdpr_consent_date=timezone.now(),
		)

	def test_get_profile_with_valid_user_id(self):
		"""Test retrieving profile data with valid user_id"""
		response = self.client.get(f"/api/update-profile/?user_id={self.user.id}")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["email"], "contact@ecole-profile.fr")
		self.assertEqual(response.data["rectorate_email"], "rectorat@ecole-profile.fr")
		self.assertIn("school_eth_address", response.data)
		self.assertIn("rectorate_eth_address", response.data)

	def test_get_profile_without_user_id(self):
		"""Test get profile without user_id returns 400"""
		response = self.client.get("/api/update-profile/")

		self.assertEqual(response.status_code, 400)
		self.assertIn("error", response.data)

	def test_get_profile_with_nonexistent_user(self):
		"""Test get profile with non-existent user_id returns 404"""
		response = self.client.get("/api/update-profile/?user_id=9999")

		self.assertEqual(response.status_code, 404)
		self.assertIn("error", response.data)

	def test_patch_profile_with_valid_otp(self):
		"""Test updating profile with valid OTP code"""
		ActionOTP.objects.create(
			user=self.user,
			action_type="UPDATE_PROFILE",
			code="654321",
			expires_at=timezone.now() + timezone.timedelta(minutes=10),
		)

		payload = {
			"user_id": str(self.user.id),
			"otp_code": "654321",
			"email": "newemail@ecole-profile.fr",
			"rectorate_email": "new-rectorat@ecole-profile.fr",
		}

		response = self.client.patch("/api/update-profile/", payload, format="json")

		self.assertEqual(response.status_code, 200)
		self.assertIn("jour", response.data["message"])

		self.user.refresh_from_db()
		self.profile.refresh_from_db()
		self.assertEqual(self.user.email, "newemail@ecole-profile.fr")
		self.assertEqual(self.profile.rectorate_email, "new-rectorat@ecole-profile.fr")

		otp = ActionOTP.objects.get(code="654321")
		self.assertTrue(otp.used)

	def test_patch_profile_without_otp_code(self):
		"""Test patch profile without OTP code returns 400"""
		payload = {
			"user_id": str(self.user.id),
			"email": "newemail@ecole.fr",
		}

		response = self.client.patch("/api/update-profile/", payload, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertIn("validation par email", response.data["error"])

	def test_patch_profile_with_invalid_otp(self):
		"""Test patch profile with wrong OTP code returns 400"""
		payload = {
			"user_id": str(self.user.id),
			"otp_code": "999999",
			"email": "newemail@ecole.fr",
		}

		response = self.client.patch("/api/update-profile/", payload, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertIn("validation incorrect", response.data["error"])

	def test_patch_profile_with_invalid_ethereum_address(self):
		"""Test patch profile with malformed Ethereum address returns 400"""
		ActionOTP.objects.create(
			user=self.user,
			action_type="UPDATE_PROFILE",
			code="654321",
			expires_at=timezone.now() + timezone.timedelta(minutes=10),
		)

		payload = {
			"user_id": str(self.user.id),
			"otp_code": "654321",
			"school_eth_address": "0xinvalid",
		}

		response = self.client.patch("/api/update-profile/", payload, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertIn("MetaMask", response.data["error"])

	def test_patch_profile_with_valid_ethereum_address(self):
		"""Test updating profile with valid Ethereum address"""
		ActionOTP.objects.create(
			user=self.user,
			action_type="UPDATE_PROFILE",
			code="654321",
			expires_at=timezone.now() + timezone.timedelta(minutes=10),
		)

		valid_eth_address = "0x1234567890123456789012345678901234567890"
		payload = {
			"user_id": str(self.user.id),
			"otp_code": "654321",
			"school_eth_address": valid_eth_address,
		}

		response = self.client.patch("/api/update-profile/", payload, format="json")

		self.assertEqual(response.status_code, 200)
		self.profile.refresh_from_db()
		self.assertEqual(self.profile.school_eth_address, valid_eth_address)


class ValidateDiplomaViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		cls.subscription_plan, _ = SubscriptionPlan.objects.get_or_create(
			name="ESSENTIEL",
			defaults={
				"display_name": "Essentiel",
				"annual_price": "990.00",
				"max_diplomas": 50,
				"level": 1,
			},
		)
		cls.user = User.objects.create_user(
			username="ecole-validate",
			email="contact@ecole-validate.fr",
			password="StrongPass!123",
		)
		cls.profile = UserProfile.objects.create(
			user=cls.user,
			rectorate_email="rectorat@ecole-validate.fr",
			subscription_plan=cls.subscription_plan,
			gdpr_consent=True,
			gdpr_consent_date=timezone.now(),
			school_eth_address="0x1111111111111111111111111111111111111111",
			rectorate_eth_address="0x2222222222222222222222222222222222222222",
		)

	def _create_diploma(self):
		return Diploma.objects.create(
			owner=self.user,
			first_name="Jean",
			last_name="Dupont",
			course_name="Master Blockchain",
			graduation_date=timezone.now().date(),
			image=SimpleUploadedFile("diploma.png", b"fake image content", content_type="image/png"),
			diploma_hash="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
		)

	@patch("diplomas.views.verify_eth_signature", return_value=True)
	def test_get_school_validation_payload(self, mock_verify_eth_signature):
		diploma = self._create_diploma()

		response = self.client.get(f"/api/validate/{diploma.school_token}/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["validation_type"], "Ã‰cole")
		self.assertFalse(response.data["already_validated"])
		self.assertEqual(response.data["first_name"], "Jean")
		self.assertEqual(response.data["last_name"], "Dupont")

	def test_get_invalid_validation_token_returns_404(self):
		response = self.client.get("/api/validate/11111111-1111-1111-1111-111111111111/")

		self.assertEqual(response.status_code, 404)
		self.assertIn("error", response.data)

	@patch("diplomas.views.verify_eth_signature", return_value=True)
	@patch("diplomas.views.certify_diploma_on_blockchain", return_value="0xdeadbeef")
	def test_school_then_rectorate_validation_moves_to_validated(self, mock_certify, mock_verify_eth_signature):
		diploma = self._create_diploma()
		school_payload = {
			"action": "validate",
			"eth_signature": "0xschool-signature",
			"eth_address": self.profile.school_eth_address,
		}

		school_response = self.client.post(f"/api/validate/{diploma.school_token}/", school_payload, format="json")

		self.assertEqual(school_response.status_code, 200)
		self.assertIn("validation (Ã‰cole)", school_response.data["message"])
		diploma.refresh_from_db()
		self.assertTrue(diploma.school_validated)
		self.assertEqual(diploma.status, "PENDING")

		rectorate_payload = {
			"action": "validate",
			"eth_signature": "0xrectorat-signature",
			"eth_address": self.profile.rectorate_eth_address,
		}
		rectorate_response = self.client.post(f"/api/validate/{diploma.rectorate_token}/", rectorate_payload, format="json")

		self.assertEqual(rectorate_response.status_code, 200)
		self.assertIn("validation (Rectorat)", rectorate_response.data["message"])
		diploma.refresh_from_db()
		self.assertTrue(diploma.rectorate_validated)
		self.assertEqual(diploma.status, "VALIDATED")
		self.assertEqual(diploma.blockchain_status, "ANCHORED")
		self.assertEqual(diploma.blockchain_tx_hash, "0xdeadbeef")
		mock_certify.assert_called_once()

	@patch("diplomas.views.verify_eth_signature", return_value=False)
	def test_validation_rejects_invalid_signature(self, mock_verify_eth_signature):
		diploma = self._create_diploma()
		payload = {
			"action": "validate",
			"eth_signature": "0xbad-signature",
			"eth_address": self.profile.school_eth_address,
		}

		response = self.client.post(f"/api/validate/{diploma.school_token}/", payload, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertIn("Signature invalide", response.data["error"])

	@patch("diplomas.views.verify_eth_signature", return_value=True)
	def test_validation_rejects_wrong_registered_address(self, mock_verify_eth_signature):
		diploma = self._create_diploma()
		payload = {
			"action": "validate",
			"eth_signature": "0xschool-signature",
			"eth_address": "0x3333333333333333333333333333333333333333",
		}

		response = self.client.post(f"/api/validate/{diploma.school_token}/", payload, format="json")

		self.assertEqual(response.status_code, 403)
		self.assertIn("non autoris", response.data["error"])



class SubscriptionPlansViewTests(APITestCase):
	@classmethod
	def setUpTestData(cls):
		# Ensure at least two plans exist for the list endpoint
		SubscriptionPlan.objects.get_or_create(
			name="ESSENTIEL",
			defaults={
				"display_name": "Essentiel",
				"annual_price": "990.00",
				"max_diplomas": 50,
				"level": 1,
			},
		)
		SubscriptionPlan.objects.get_or_create(
			name="CAMPUS",
			defaults={
				"display_name": "Campus",
				"annual_price": "1990.00",
				"max_diplomas": 200,
				"level": 2,
			},
		)

	def test_get_plans_returns_list_with_expected_fields(self):
		response = self.client.get("/api/plans/")

		self.assertEqual(response.status_code, 200)
		# The view returns a list of plan objects
		self.assertIsInstance(response.data, list)
		self.assertGreaterEqual(len(response.data), 1)

		# Check required serializer fields on each plan
		for plan in response.data:
			self.assertIn("id", plan)
			self.assertIn("name", plan)
			self.assertIn("display_name", plan)
			self.assertIn("annual_price", plan)
			self.assertIn("max_diplomas", plan)
			self.assertIn("level", plan)

		# At least one known plan should be present
		names = [p["name"] for p in response.data]
		self.assertIn("ESSENTIEL", names)
