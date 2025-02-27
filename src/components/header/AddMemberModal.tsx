import React, { useState } from 'react';
import { SearchUserList } from './SearchUserList';
import { userService } from '../../services/user.service';
import { channelsService } from '../../services/channels.service';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isOpen, 
  onClose,
  channelId 
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    username: string;
    avatarUrl: string;
  }>>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await userService.searchUsers(searchQuery);
      // Filter out current user and existing members
      const filteredResults = await channelsService.filterNonMembers(channelId, results);
      if (filteredResults) setSearchResults(filteredResults);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (memberId: string) => {
    if (!user) return;

    try {
      await channelsService.addChannelMember(channelId, memberId);
      toast.success('Member added successfully');
      // Remove added user from search results
      setSearchResults(prev => prev.filter(u => u.id !== memberId));
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Channel Member</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username..."
            className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <SearchUserList
          users={searchResults}
          onAddUser={handleAddMember}
          actionLabel="Add"
        />
      </div>
    </div>
  );
};