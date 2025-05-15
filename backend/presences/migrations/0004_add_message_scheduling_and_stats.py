from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('presences', '0003_remove_message_contenu_html_and_more'),
    ]

    operations = [
        # Ajouter les champs pour la programmation des messages
        migrations.AddField(
            model_name='message',
            name='date_programmee',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Date programmée'),
        ),
        
        # Ajouter les champs pour les statistiques de lecture
        migrations.AddField(
            model_name='message',
            name='est_lu',
            field=models.BooleanField(default=False, verbose_name='Message lu'),
        ),
        migrations.AddField(
            model_name='message',
            name='date_lecture',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Date de lecture'),
        ),
        
        # Mettre à jour les choix de statut
        migrations.AlterField(
            model_name='message',
            name='statut',
            field=models.CharField(
                choices=[
                    ('brouillon', 'Brouillon'),
                    ('programme', 'Programmé'),
                    ('en_attente', 'En attente'),
                    ('envoye', 'Envoyé'),
                    ('echec', 'Échec')
                ],
                default='brouillon',
                max_length=10
            ),
        ),
    ]
