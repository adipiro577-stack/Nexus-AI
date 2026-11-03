from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from nexusai_app.models import Project, ProjectDatabaseDesign

User = get_user_model()


class ProjectDatabaseDesignApiTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='dbdesignowner', email='dbdesignowner@example.com', password='Strong-test-password!123'
        )
        self.other = User.objects.create_user(
            username='dbdesignother', email='dbdesignother@example.com', password='Strong-test-password!123'
        )
        self.project = Project.objects.create(
            name='Hospital Management System', description='Manage hospital operations.',
            category='Healthcare', owner=self.owner
        )
        self.url = reverse('project_database_design', args=[self.project.pk])
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

    def payload(self):
        return {
            'provider': 'NVIDIA',
            'model': 'nvidia/test-model',
            'django_models': 'from django.db import models\n\nclass Patient(models.Model):\n    name = models.CharField(max_length=150)',
            'tables': [
                {
                    'name': 'Patient',
                    'description': 'Patient identity and contact information.',
                    'columns': [
                        {'name': 'id', 'type': 'BigAutoField', 'primary_key': True, 'nullable': False},
                        {'name': 'full_name', 'type': 'CharField', 'primary_key': False, 'nullable': False},
                        {'name': 'date_of_birth', 'type': 'DateField', 'primary_key': False, 'nullable': True},
                    ],
                },
                {
                    'name': 'Doctor',
                    'description': 'Doctor profile and specialization.',
                    'columns': [
                        {'name': 'id', 'type': 'BigAutoField', 'primary_key': True, 'nullable': False},
                        {'name': 'full_name', 'type': 'CharField', 'primary_key': False, 'nullable': False},
                        {'name': 'specialization', 'type': 'CharField', 'primary_key': False, 'nullable': False},
                    ],
                },
                {
                    'name': 'Appointment',
                    'description': 'Patient-doctor appointment schedule.',
                    'columns': [
                        {'name': 'id', 'type': 'BigAutoField', 'primary_key': True, 'nullable': False},
                        {'name': 'patient', 'type': 'ForeignKey', 'primary_key': False, 'nullable': False, 'foreign_key': 'Patient'},
                        {'name': 'doctor', 'type': 'ForeignKey', 'primary_key': False, 'nullable': False, 'foreign_key': 'Doctor'},
                    ],
                },
            ],
        }

    def test_get_returns_empty_design_before_generation(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['design'])

    def test_save_and_load_project_database_design(self):
        saved = self.client.put(self.url, self.payload(), format='json')
        self.assertEqual(saved.status_code, 200, saved.content)
        self.assertEqual(ProjectDatabaseDesign.objects.filter(project=self.project).count(), 1)
        self.assertEqual(len(saved.data['design']['tables']), 3)
        loaded = self.client.get(self.url)
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.data['design']['provider'], 'NVIDIA')
        self.assertEqual(loaded.data['design']['tables'][2]['name'], 'Appointment')

    def test_saving_again_replaces_project_design(self):
        self.client.put(self.url, self.payload(), format='json')
        updated = self.payload()
        updated['tables'][0]['description'] = 'Updated patient profile.'
        response = self.client.put(self.url, updated, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ProjectDatabaseDesign.objects.filter(project=self.project).count(), 1)
        self.assertEqual(response.data['design']['tables'][0]['description'], 'Updated patient profile.')

    def test_other_user_cannot_read_or_replace_design(self):
        self.client.put(self.url, self.payload(), format='json')
        other_client = APIClient()
        other_client.force_authenticate(user=self.other)
        self.assertEqual(other_client.get(self.url).status_code, 404)
        self.assertEqual(other_client.put(self.url, self.payload(), format='json').status_code, 404)

    def test_invalid_field_type_is_rejected(self):
        invalid = self.payload()
        invalid['tables'][0]['columns'][1]['type'] = 'ExecutableField'
        response = self.client.put(self.url, invalid, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(ProjectDatabaseDesign.objects.filter(project=self.project).exists())

    def test_anonymous_user_is_denied(self):
        anonymous = APIClient()
        self.assertIn(anonymous.get(self.url).status_code, (401, 403))
