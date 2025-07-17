import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../utils/api';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import useAuth from '../hooks/useAuth';

// Validation schema for address form
const addressSchema = yup.object().shape({
  type: yup.string().required('Address type is required'),
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone number is required'),
  line1: yup.string().required('Address line is required'),
  line2: yup.string(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zip: yup.string().required('ZIP code is required'),
  country: yup.string().required('Country is required'),
  isDefault: yup.boolean()
});

const AccountAddresses = () => {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: {
      type: '',
      name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      isDefault: false
    }
  });

  // Fetch addresses when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setAddresses(response.data.data.user.addresses || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for adding/editing address
  const onSubmit = async (data) => {
    try {
      setStatusMessage({ type: '', message: '' });
      
      if (editingAddress) {
        // Update existing address
        const response = await api.put(`/auth/address/${editingAddress._id}`, data);
        setStatusMessage({ type: 'success', message: 'Address updated successfully' });
        
        // Update addresses list
        setAddresses(response.data.data.addresses);
      } else {
        // Add new address
        const response = await api.post('/auth/address', data);
        setStatusMessage({ type: 'success', message: 'Address added successfully' });
        
        // Update addresses list with the response
        setAddresses(response.data.data.addresses);
      }
      
      // Reset form and state
      reset();
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      console.error('Error saving address:', err);
      setStatusMessage({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to save address. Please try again.'
      });
    }
  };

  // Handle edit address
  const handleEdit = (address) => {
    setEditingAddress(address);
    reset({
      type: address.addressType,
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      isDefault: address.isDefault || false
    });
    setShowForm(true);
  };

  // Handle delete address
  const handleDelete = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await api.delete(`/auth/address/${addressId}`);
        setStatusMessage({ type: 'success', message: 'Address deleted successfully' });
        
        // Update addresses list with the response
        setAddresses(response.data.data.addresses);
      } catch (err) {
        console.error('Error deleting address:', err);
        setStatusMessage({ 
          type: 'error', 
          message: err.response?.data?.message || 'Failed to delete address. Please try again.'
        });
      }
    }
  };

  // Handle add new address button
  const handleAddNew = () => {
    setEditingAddress(null);
    reset();
    setShowForm(true);
  };

  // Handle cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Addresses</h2>
        {!showForm && (
          <Button 
            onClick={handleAddNew}
            className="flex items-center gap-2"
          >
            <FaPlus /> Add New Address
          </Button>
        )}
      </div>

      {/* Status message */}
      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {/* Loading and error states */}
      {loading ? (
        <div className="text-center py-8">Loading addresses...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <>
          {/* Address form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-medium mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Address Type (e.g. Home, Office)"
                      {...register('type')}
                      error={errors.type?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Full Name"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Phone Number"
                      {...register('phone')}
                      error={errors.phone?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Address Line 1"
                      {...register('line1')}
                      error={errors.line1?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Address Line 2 (Optional)"
                      {...register('line2')}
                      error={errors.line2?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="City"
                      {...register('city')}
                      error={errors.city?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="State/Province"
                      {...register('state')}
                      error={errors.state?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="ZIP/Postal Code"
                      {...register('zip')}
                      error={errors.zip?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Country"
                      {...register('country')}
                      error={errors.country?.message}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('isDefault')}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="text-gray-700">Set as default address</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses list */}
          {addresses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">You don't have any saved addresses yet.</p>
              {!showForm && (
                <Button 
                  onClick={handleAddNew} 
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Address
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-lg">{address.type}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(address)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(address._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    <p className="font-medium">{address.name}</p>
                    <p>{address.phone}</p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.city}, {address.state} {address.zip}</p>
                    <p>{address.country}</p>
                    {address.isDefault && (
                      <p className="mt-2 text-sm text-blue-600 font-medium">Default Address</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountAddresses;