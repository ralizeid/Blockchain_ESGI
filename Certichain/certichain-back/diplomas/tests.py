from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import SubscriptionPlan, UserProfile


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
