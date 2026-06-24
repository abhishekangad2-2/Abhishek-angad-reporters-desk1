#!/bin/bash
# ReportersDesk - Google Cloud Platform Provisioning Script
# Run this script using Google Cloud Shell or a local terminal with gcloud installed.

set -e

PROJECT_ID="abhishek-angad-reporters-desk1"
REGION="us-central1"
SQL_INSTANCE_NAME="reportersdesk-db"
DB_NAME="payload"
DB_USER="payload"
DB_PASSWORD="your-secure-password" # Please change this or use Secret Manager to generate it
STORAGE_BUCKET_NAME="reportersdesk-media-${PROJECT_ID}"

echo "🚀 Starting ReportersDesk GCP Provisioning in project: $PROJECT_ID"

# 1. Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  --project $PROJECT_ID

# 2. Create Cloud SQL Instance (PostgreSQL)
echo "🗄️ Provisioning Cloud SQL for PostgreSQL (This may take ~10 minutes)..."
gcloud sql instances create $SQL_INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-8192 \
  --region=$REGION \
  --project=$PROJECT_ID \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery

# Create Database inside the instance
echo "🗃️ Creating database '$DB_NAME'..."
gcloud sql databases create $DB_NAME \
  --instance=$SQL_INSTANCE_NAME \
  --project=$PROJECT_ID

# Create User
echo "👤 Creating database user '$DB_USER'..."
gcloud sql users create $DB_USER \
  --instance=$SQL_INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID

# 3. Create Google Cloud Storage Bucket for Media
echo "🪣 Creating Cloud Storage bucket '$STORAGE_BUCKET_NAME'..."
gcloud storage buckets create gs://$STORAGE_BUCKET_NAME \
  --project=$PROJECT_ID \
  --location=$REGION \
  --uniform-bucket-level-access

# Make bucket public for reading media
gcloud storage buckets add-iam-policy-binding gs://$STORAGE_BUCKET_NAME \
  --member=allUsers \
  --role=roles/storage.objectViewer

# 4. Provision Secret Manager (Secrets need to be filled manually after creation)
echo "🔐 Creating Secrets in Secret Manager..."
SECRETS=("PAYLOAD_SECRET" "PENDING_2FA_SECRET" "RESEND_API_KEY" "OPENAI_API_KEY" "RAZORPAY_WEBHOOK_SECRET")

for SECRET in "${SECRETS[@]}"; do
  gcloud secrets create $SECRET --replication-policy="automatic" --project=$PROJECT_ID || echo "Secret $SECRET already exists"
done

echo "✅ GCP Infrastructure Provisioning Complete!"
echo ""
echo "Next Steps:"
echo "1. Go to Google Cloud Console -> Secret Manager and add the actual string values to the secrets."
echo "2. Update your .env.example or github deployment workflow with your Cloud SQL connection string:"
echo "   DATABASE_URI: postgres://$DB_USER:$DB_PASSWORD@/cloudsql/$PROJECT_ID:$REGION:$SQL_INSTANCE_NAME/$DB_NAME"
echo "3. Run the GitHub Action deployment pipeline to deploy the code to Cloud Run."
