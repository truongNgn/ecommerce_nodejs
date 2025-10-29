import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const SocialCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleSocialCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refresh = searchParams.get('refresh');
      const error = searchParams.get('error');

      if (error) {
        console.error('Social login error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        try {
          await handleSocialCallback(token, refresh);
          navigate('/');
        } catch (error) {
          console.error('Social login callback failed:', error);
          navigate('/login?error=callback_failed');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, handleSocialCallback, navigate]);

  return (
    <Container className="py-5">
      <div className="text-center">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h4>Completing social login...</h4>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </Container>
  );
};

export default SocialCallback;
